/* This class provides a virtual real-time cached access to the sorted and filtered
 * table (PHPSlickGrid_Db_Table_Abstract) from the server.
 * 
 * CONCEPTS:
 * =========
 * 
 * The Problem:
 * ============
 * 
 * When the grid is viewed by the user, it can be updated by other user and 
 * background processes.  If the user has sorted or filtered their view
 * of the grid, any rows updated or added by others could affect the view.  
 * 
 * In order to maintain a consistent view of the data for each user and 
 * prevent rows from "jumping around", as the data is changed, this library 
 * attempts to cache a limited number of rows and only maintain the "state" 
 * of this limited set of rows, while providing the illusion to the user that
 * all the rows are currently in view.  Only rows in the buffer will be updated
 * in real time, and as the user scrolls any rows not in the buffer are fetched
 * from the server and older rows are discarded, further propagating the illusion 
 * that the user can "see" all the rows.
 * 
 * Any new rows that are added after the last grid invalidation (data sort or
 * page refresh) are placed at the bottom of the grid.  This keep the grid
 * from "jumping up" while the user is trying to edit or view a row.
 *
 *
 * 
 * 
 * 
 * Definitions:
 * ============
 * 
 * row            - SlickGrid zero based row number
 * item           - a full row of data
 * reverse_lookup - Primary key to SlickGrid row lookup; reverseLookup["k"+primary_key] = row
 *                  Populated in a lazy fashion.
 * block          - block number of a record; block = (Math.floor(row / blockSize))
 * block_idx      - index inside a block of a row; block_idx = (row % blockSize)
 * page           - array holding a block of records
 * pages          - array of page
 * state          - state of the cache
 * inital_state   - state of the cache as passed from the server
 * default_state  - defaults for state if the server doesn't set them
 * active_pages   - arrays of {block, "top" | "bottom"} used to delete old pages
 * 
 * 
 * MaxDateTimeSoFar
 * MaxPrimarySoFar
 * BufferMaxRowSoFar
 * 
 */


(function($) {
	$.extend(true, window, {
		PHPSlickGrid : {
			JSON : {
				DataCache : DataCache
			}
		}
	});

	function DataCache(inital_state) {
		
		var self = this;
		
		var default_state = {
				
			gridName : 'grid', 		// Grid name used to decode column names.  Column names are (gridName)$(columnName)
				
			/* jsonrpc holds the JSON RPC url.  This url is used for sending data to and from this library.
			 * without this url nothing will work.  This is usually set in the PHPSlickGrid helper and must point
			 * to the appropriate action in the controller. */
			jsonrpc : null,     	// JSON RPC URL
				
			/* Pooling frequency used to keep in sync with other users */
			pollFrequency : false,	// 2500 = 2.5 seconds, 1000 = 1 second, false = no polling
				
			/* Key Columns */
			primay_col : null,  	// Column name of the primary key. used used for hashing array for quick lookup.
			upd_dtm_col : null, 	// Time stamp column, used to keep track of when to "update" the column values.
			deleted_col : null,		// Column to indicate the row has been deleted.
				
			/* Key Metrics that are derived from the rows */
			gridLength : null,		// Length (row count) of the data in the grid.
			totalRows: null,		// Total number of posible rows if no filters were applied.
			maxDateTime : null,		// The maximum date and time seen so far, used to know when to update a row.

			sortedLength: null,		// Length (row count) of the sorted rows in the grid.  See top of this file for a description. 
			sortedMaxPrimary : null,// The maximum primary key for the sorted portion of the buffer.
				
			/* Buffer status */
			blockSize : 100,  		// Number of rows (records) to try and get per JASON RPC call.
			bufferMax : 300,		// Maximum number of rows (records) to keep at any given time.
			// TODO: for bufferMax, look in slickgird.js at resizeCanvas and make bufferMax 
			// slightly bigger than 3*numVisibleRows.  Make blockSize = numVisibleRows.									
			
			
			/* Sorts and filters */
			order_list : [],		// Current sort order
			filters : {},  			// Current filters
				
			/* List of active rows */
			active_buffers : [],	// List of actively cached slickgrid rows
			activeKeys : [],		// List of primary keys currently being buffered.
		
			/* Local Storage */
			localStorage : {}
		};
		
		var localStorageDefault = {
			sort : [],
			filters : [], 
			activeRow : {
				row : 0,
				cell : 0,
				key : null
			},
			columnPos : {}
		};
			
		// Prime the state default state + initial state from server.
		self.state = $.extend(true, {}, default_state, inital_state);
		
		
		
		// Merge the any saved local storage with the default (Saved trumps default)
		var localStorage = store.get(self.state.gridName);
		if (localStorage != undefined)
			localStorage = $.extend(true, {}, localStorageDefault, localStorage);
		else 
			localStorage = localStorageDefault;
		
		// Merge the saved local storage with the initial state (initial trumps saved)
		self.state.localStorage = $.extend(true, {}, localStorage, self.state.localStorage);
		
		
		
		// Save the local storage state
		store.set(self.state.gridName, self.state.localStorage);
		
		setSort(self.state.localStorage.sort);
		
		// Complementary cache arrays:
		self.buffer = new Array();			// Buffer of actively cached items, self.buffer["k"+row] = array of row data.
		self.reverseLookup = new Array();	// Reverse lookup, self.reverseLookup['k'+primary key from db] = row in slickgrid.
		
		// Array of items that fell out of scope during view.
		self.outOfScope = new Array();
		
		// events
		var onRowCountChanged = new Slick.Event();
		var onRowsChanged = new Slick.Event();
	//	var onSync = new Slick.Event();
		var onActiveKeyLoaded = new Slick.Event();
		var onRowTotalCountChanged = new Slick.Event();
		var onStateChanged = new Slick.Event();
		var onFiltersChanged = new Slick.Event();
		var onInvalidate = new Slick.Event();

		
		
		// Check JSON URL
		$.get( self.state['jsonrpc'], function() {})
			.fail(function() {
			alert( "jsonAction() is missing from the controller or $Grid->getGridConfiguration()->jsonrpc is wrong.\n" +
					"JSON RPC URL is: "+self.state['jsonrpc'] );
			});
		
		// Service to call on the server side
		self.service = new jQuery.Zend.jsonrpc({
			url : self.state['jsonrpc'],
			async : true,
			//'error': function(data) {alert(data);inFlight=0;}, //
			// Connection error
			'error' : function(data) {
				//console.log(data);
				//alert(data.error_request.responseText);
				//alert('The connection to the server has timed out. Click OK to try again.');
				// inFlight = 0;
			}, // Connection error
			'exceptionHandler' : function(data) {
				alert(data);
				onInvalidate.notify();
			}
		}); // thrown exception.
		
		/**
		 * Return the current best known cached gridRowCount. 
		 *
		 * If the cache has expired, update the number of filtered rows 
		 * (self.state.gridLength) and the total number of rows 
		 * (self.state.totalRows).
		 */
		function getLength() {
			return (self.state.gridLength - 0);
		}
		
		function AddItemToBuffer(row, item){
			
			//force row to be an integer
			row=parseInt(row);
			
			// Add to data, reverse lookup and stack
			self.buffer["k"+row]=item;
			self.reverseLookup["k" + item[self.state.primay_col]]=row;
			self.state.active_buffers.push("k"+row);
			self.state.activeKeys.push(item[self.state.primay_col]);
			
			// put row into scope
			delete self.outOfScope["k"+row];
			
			// Maintain our buffer size limit
			while (self.state.active_buffers.length>=self.state.bufferMax) {
				var toRemove=self.state.active_buffers.shift();
				self.state.activeKeys.shift();
				if (self.buffer[toRemove]!=undefined) {
					delete self.reverseLookup["k" + self.buffer[toRemove][self.state.primay_col]];
					delete self.buffer[toRemove];
				}
				
				// delete any out of scope refrence
				if (self.outOfScope["k" + toRemove]!=undefined)
					delete self.outOfScope["k" + toRemove];
			}
		}
		
		function getBlock(start, data) {
		
			// Create array of updated indices
			var indices = new Array();
			
			var len = data.length;
			for ( var i = 0; i < len; i++) {
				
				AddItemToBuffer(start+i, data[i]);
				
				// Track what rows the grid needs to update
				indices.push(start+i);
				
				// Update time/date of the newest item seen.
				if (typeof data[i][self.state.upd_dtm_col] != 'undefined') 
					if (String(data[i][self.state.upd_dtm_col]) > String(self.state.newestRecord))
						self.state.newestRecord = data[i][self.state.upd_dtm_col];
				
				// TODO: This might be better in getItem.
				if (typeof data[i][self.state.primay_col] != 'undefined') 
					if (String(data[i][self.state.primay_col]) == String(self.state.localStorage.activeRow.key))
						onActiveKeyLoaded.notify({
							row : (start+i), cell : self.state.localStorage.activeRow.cell
						}, null, self);
			}
			
			// clean up
			delete data;
			
			// Notify listener of rows that have changed
			onRowsChanged.notify({
				rows : indices
			}, null, self);
			
		}
		

		function getItem(row) {
			
			var fetchSize=0;
			var start = row;
			
			if (typeof self.buffer["k"+row] == 'undefined') {

				for( var i=0; i<self.state.blockSize; i++) {
					if (typeof self.buffer["k"+(row+i)] == 'undefined') {
						if ((row+i)<self.state.gridLength) {
							self.buffer["k"+(row+i)] = new Array();
							fetchSize++;
						}
					}
					else {
						if ((start-1) > 0) {
							if (typeof self.buffer["k"+(start)] == 'undefined') {
								self.buffer["k"+(start)] = new Array();
								fetchSize++;
								start--;
							}
							else
								break;
						}
						else
							break;
					}
				}
				
				if (fetchSize!=0){
					//console.log("pre self.service.getBlock ***************");
					//console.log(self.state);
					self.service.getBlock(start, (fetchSize+1), self.state, {
						'success' : function(data) {
							getBlock(start, data);
						}
					});
				}
			}
			// return whatever we have.
			return self.buffer["k"+row];
		}
		
		
		function invalidate() {
			
			self.state.localStorage.activeRow.row = null;
		
			self.state.active_buffers 	= [];
			self.state.activeKeys 		= [];		
			
			self.buffer 		= new Array();
			self.reverseLookup 	= new Array();		
			
			self.service.resetState(self.state ,{
				'success' : function(newState) {
					console.log("Resetting state **************");
					console.log(self.state.filters);
					self.state = $.extend(true, {}, self.state, newState);
					/* The jQuery.Zend.jsonrpc class appears to have issues when passed back an empty object.  
					 * If passed back an empty object it will be converted to an empty array.  I suspect this 
					 * is due to PHP and JavaScript being a loosely typed language.  
					 * 
					 * James Stormes - Aug 20, 2014
					 */
					// Repair the filters if changed to array.
					console.log(self.state.filters);
					if (Object.prototype.toString.call( self.state.filters )==="[object Array]")
						self.state.filters={};
					
					onRowCountChanged.notify();
					onStateChanged.notify(self.state);
				}
			});

		}
		
		function getColumnFilters(column) {
			return self.state.filters[column];
		}
		
		function setColumnFilters(column,filters) {
			//console.log()
			self.state.filters[column]=filters;
			console.log(self.state.filters);
			this.invalidate();
			//self.filters = filters;
			console.log(self.state.filters);
			onFiltersChanged.notify(filters);
		}
		
		function getSort() {
			return self.state.localStorage.sort;
		}

		function setSort(sortarray) {
			
			//console.log("setting sort");
			
			self.state.localStorage.sort = sortarray;
			store.set(self.state.gridName , self.state.localStorage);
			
			self.state.order_list= [];
			
			for (var i = 0; i < sortarray.length; i++) {
				if (sortarray[i].sortAsc)
					self.state.order_list.push(sortarray[i].columnId+ ' asc');
				else
					self.state.order_list.push(sortarray[i].columnId+' desc');
			}
		}
		
		function setActive(row,cell) {
			self.state.localStorage.activeRow.row=row;
			self.state.localStorage.activeRow.cell=cell;
			if (self.buffer["k"+row]!=undefined) {
				if (self.buffer["k"+row][self.state.primay_col]!=undefined)
					self.state.localStorage.activeRow.key=self.buffer["k"+row][self.state.primay_col];
			}
			else {
				self.state.localStorage.activeRow.key=null;
			}
			//console.log(self.state.localStorage.activeRow);
			store.set(self.state.gridName , self.state.localStorage);
		}
		
		function getActiveRow() {
			return self.state.localStorage.activeRow.row;
		}
		
		function getActiveCell() {
			return self.state.localStorage.activeRow.cell;
		}
		
		function getActiveKey() {
			return self.state.localStorage.activeRow.key;
		}
		
		function saveColumns(columns) {
		        
			self.state.localStorage.columnPos = [];
		    
		    for (var i = 0; i < columns.length; i++) {
		    	var obj = {
		    			width: columns[i].width,
		                id: columns[i].id
		    	};
		    	self.state.localStorage.columnPos.push(obj);
		    }

		    store.set(self.state.gridName , self.state.localStorage);
		}
		
		function restoreColumns(columns) {
			
			var columnIdx = {};
			for(var i = 0; i< columns.length; i++) {
				columnIdx[columns[i].id]=i;
			}
			
			var newColumns = [];
			for(var i = 0; i<self.state.localStorage.columnPos.length; i++) {
				if (columns[columnIdx[self.state.localStorage.columnPos[i].id]]!=undefined) {
					columns[columnIdx[self.state.localStorage.columnPos[i].id]].width=self.state.localStorage.columnPos[i].width;
					newColumns.push(columns[columnIdx[self.state.localStorage.columnPos[i].id]]);
					delete columnIdx[self.state.localStorage.columnPos[i].id];
				}
			}
			
			for (var key in columnIdx) {
				newColumns.push(columns[columnIdx[key]]);
			}
			
			return newColumns;
		}
		
		function updateItem(item) {
			console.log("updateItem()");
			console.log(item);
			console.log(item[self.state['primay_col']]);
			if (item[self.state['primay_col']]==null)
				return addItem(item);
			// Don't let the user move on until the row has been saved.  
			self.service.setAsync(false);
			var data = self.service.updateItem(item, self.state);
			// update buffers
			SyncData(data);
			self.service.setAsync(true);
		}

		function addItem(item) {
			
			console.log("AddItem()");
			// Don't let the user move on until the row has been saved.  
			self.service.setAsync(false);
			var NewRow = self.service.addItem(item, self.state);
			
			// update buffers
			AddItemToBuffer(self.state.gridLength, NewRow);
			self.service.setAsync(true);
			
			// Update the grid.
			onRowsChanged.notify({rows: [parseInt(self.state.gridLength)]}, null, self);
			self.state.gridLength++;
			onRowCountChanged.notify();
			
			
			self.state.active_buffers 	= [];
			self.state.activeKeys 		= [];		
			
			self.buffer 		= new Array();
			self.reverseLookup 	= new Array();		
			
			onInvalidate.notify();
			
		}
		
		function deleteItem(item) {
			self.service.setAsync(false);
			var data = self.service.deleteItem(item, self.state);
			// update buffers
			SyncData(data);
			self.service.setAsync(true);
		}		
		
		function SyncData(data) {
			
			// Track the grid length
			if (self.state.gridLength!=data['gridLength']) {
				self.state.gridLength=data['gridLength'];
				onRowCountChanged.notify();
			}
			
			// Track the total length
			if (self.state.totalRows!=data['totalRows']) {
				self.state.totalRows=data['totalRows'];
				onRowTotalCountChanged.notify();
			}
			
			// Track rows that get updated
			var indices = new Array();
			
			// Loop through our updated rows
			var len = data['UpdatedRows'].length;				
			for (var i=0;i<len;i++) {
				var row = self.reverseLookup["k" + data['UpdatedRows'][i][self.state.primay_col]];
				self.buffer["k"+row]=data['UpdatedRows'][i];
				indices.push(row);
				
				// Update newest date time so we can track what to update
				if (String(self.state.maxDateTime) < String(data['UpdatedRows'][i][self.state.upd_dtm_col]))
	            	self.state.maxDateTime=data['UpdatedRows'][i][self.state.upd_dtm_col];		
				
				// Put out of scope row back into play if we get an update for it.
				if (typeof(self.outOfScope["k"+row])!='undefined') {
					delete(self.outOfScope["k"+row]);
				}
			}

			// Loop thorough buffered rows that fell out of scope.
			var len = data['outOfScope'].length;
			for (var i=0;i<len;i++) {
				var row = self.reverseLookup["k"+data['outOfScope'][i]];
				if (typeof(self.outOfScope["k"+row])=='undefined') {
					indices.push(row);
					self.outOfScope["k"+row]=1;
				}
			}
			
			// Tell listeners that rows have been updated
			if (indices.length > 0) {
				onRowsChanged.notify({rows: indices}, null, self);
			}			
		}
		
		
		// If we have a pollFrequency should we poll the server.
		if (self.state.pollFrequency) {
		
			function SyncController(data) {
				
				SyncData(data);
							
				setTimeout(SyncRequest, self.state.pollFrequency);
			}
			
			function SyncFailed(data) {
				setTimeout(SyncRequest, self.state.pollFrequency);
			}
			
			function SyncRequest() {				
				// TODO: Add the data from SyncInjectData.
								
				self.service.SyncDataCache(self.state,{'success':function(data) {SyncController(data); },
				'error' : function(data) {SyncFailed(data); }, 
				'exceptionHandler' : function(data) {SyncFailed(data); }
				});
			}
			
			// Kick off the Syncing
			//SyncRequest();
			setTimeout(SyncRequest, parseInt(self.state.pollFrequency));
		}
		
		function getItemMetadata(row) {

			if (typeof(self.outOfScope["k"+row])!='undefined') {
				return {
					"selectable":false,
					"focusable":false,
					"cssClasses":"disabled"
				};
			}
				
			return null;
		}

		
		return {

			// data provider methods
			"getLength" : getLength,
			"getItem" : getItem,
			"addItem": addItem,
			"updateItem": updateItem,
			"deleteItem": deleteItem,
			"onRowCountChanged" : onRowCountChanged,
			"onRowTotalCountChanged" : onRowTotalCountChanged,
			"onRowsChanged" : onRowsChanged,
			"onFiltersChanged" : onFiltersChanged,
			"getItemMetadata" : getItemMetadata,
			"onInvalidate" : onInvalidate,
			"setSort" : setSort,
			"getSort" : getSort,
			"setActive" : setActive,
			"getActiveRow" : getActiveRow,
			"getActiveCell" : getActiveCell,
			"getActiveKey" : getActiveKey,
			"onActiveKeyLoaded" : onActiveKeyLoaded,
			"onStateChanged" : onStateChanged,
			"invalidate" : invalidate,
			"saveColumns" : saveColumns,
			"restoreColumns" : restoreColumns,
			"getColumnFilters" : getColumnFilters,
			"setColumnFilters" : setColumnFilters,
			"self" : self

		};
	}
})(jQuery);
