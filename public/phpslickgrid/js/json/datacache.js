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
			pollFrequency : 0,	// 2500 = 2.5 seconds, 1000 = 1 second
				
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
			bufferMax : 300,		    // Maximum number of rows (records) to keep at any given time.
			// TODO: for bufferMax, look in slickgird.js at resizeCanvas and make bufferMax 
			// slightly bigger than 2*numVisibleRows.									
			
			
			/* Sorts and filters */
			order_list : [],		// Current sort order
			filters : [],  			// Current filters
				
			/* List of active rows */
			active_buffers : [],	// List of actively cached slickgrid rows
			activeKeys : []			// List of primary keys currently being buffered.
		};
			
		// Prime the state default state + initial state from server.
		self.state = $.extend(true, {}, default_state, inital_state);
		
		// Complementary cache arrays:
		self.buffer = new Array();			// Buffer of actively cached items, self.buffer["k"+row] = array of row data.
		self.reverseLookup = new Array();	// Reverse lookup, self.reverseLookup['k'+primary key from db] = row in slickgrid.
		
		self.outOfScope = new Array();
		
		
		// events
		var onRowCountChanged = new Slick.Event();
		var onRowsChanged = new Slick.Event();
	//	var onSync = new Slick.Event();
		var onRowTotalCountChanged = new Slick.Event();

		
		
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
		
		function getBlock(start, data) {
		
			// Create array of updated indices
			var indices = new Array();
			
			var len = data.length;
			for ( var i = 0; i < len; i++) {
				// Add to data, reverse lookup and stack
				self.buffer["k"+(start+i)]=data[i];
				self.reverseLookup["k" + data[i][self.state.primay_col]]=(start+i);
				self.state.active_buffers.push("k"+(start+i));
				self.state.activeKeys.push(data[i][self.state.primay_col]);
				
				delete self.outOfScope["k"+(start+i)];
				
				// Track what rows the grid needs to update
				indices.push(start+i);
				
				// Update time/date of the newest item seen.
				if (typeof data[i][self.state.upd_dtm_col] != 'undefined') 
					if (String(data[i][self.state.upd_dtm_col]) > String(self.state.newestRecord))
						self.state.newestRecord = data[i][self.state.upd_dtm_col];
				
				// Maintain our buffer size limit
				while (self.state.active_buffers.length>=self.state.bufferMax) {
					var toRemove=self.state.active_buffers.shift();
					self.state.activeKeys.shift();
					delete self.reverseLookup["k" + self.buffer[toRemove][self.state.primay_col]];
					delete self.buffer[toRemove];
				}
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
			
			if (row>=self.state.gridLength) {
				console.log("Getting new row");
				console.log(row);
				//return [];
			}
			//console.log("getting row "+row);
			console.log(typeof(self.buffer["k"+row]));
			if (typeof self.buffer["k"+row] == 'undefined') {
				console.log("looking for buffer");
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
				console.log("getting block "+start+" "+fetchSize);
				if (fetchSize!=0)
					self.service.getBlock(start, (fetchSize), self.state, {
						'success' : function(data) {
							getBlock(start, data);
						}
					});
			}
			// return whatever we have.
			return self.buffer["k"+row];
		}
		
		
		function invalidate() {
						
			self.service.setAsync(false);
			var newState = self.service.resetState(self.state);
			self.state = $.extend(true, {}, self.state, newState);
		
			self.state.active_buffers 	= [];
			self.state.activeKeys 		= [];		
			
			self.buffer 		= new Array();
			self.reverseLookup 	= new Array();
			self.service.setAsync(true);
		}

		function setSort(sortarray) {
			self.state.order_list = sortarray;
		}
		
		function updateItem(item) {
			// Don't let the user move on until the row has been saved.  
			self.service.setAsync(false);
			var data = self.service.updateItem(item, self.state);
			// update buffers
			SyncData(data);
			self.service.setAsync(true);
		}

		function addItem(item) {
			// Don't let the user move on until the row has been saved.  
			self.service.setAsync(false);
			
			var NewRow = self.service.addItem(item, self.state);
			console.log(NewRow);
			console.log(self.state.gridLength);
			self.buffer["k"+(self.state.gridLength)] = NewRow;
			self.reverseLookup["k" + NewRow[self.state.primay_col]]=(self.state.gridLength);
			self.state.active_buffers.push("k"+(self.state.gridLength));
			self.state.activeKeys.push(NewRow[self.state.primay_col]);
			console.log(self.buffer["k"+(self.state.gridLength)]);
			delete self.outOfScope["k"+(self.state.gridLength)];
			//onRowsChanged.notify({rows: [parseInt(self.state.gridLength)+1]}, null, self);
			//var start = parseInt(self.state.gridLength);
			//console.log("start = "+start);
			//var fetchSize=1;
			//var data = self.service.getBlock(start, (fetchSize), self.state);
			//getBlock(start, data);
			// update buffers
			//SyncData(data);
			
			self.service.setAsync(true);
			onRowsChanged.notify({rows: [parseInt(self.state.gridLength)]}, null, self);
			self.state.gridLength++;
			onRowCountChanged.notify();
			
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
				console.log("Length changed");
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
			setTimeout(SyncRequest, self.state.pollFrequency);
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
			"getItemMetadata" : getItemMetadata,
			"setSort" : setSort,
			"invalidate" : invalidate,
			"self" : self

		};
	}
})(jQuery);
