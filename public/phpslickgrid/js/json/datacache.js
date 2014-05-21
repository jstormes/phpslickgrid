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
		
		// TODO: for blockSize, look in slickgird.js at resizeCanvas and make blockSize 
		// slightly bigger than numVisibleRows.
		var default_state = {
				
			gridName : 'grid', 		// Grid name used to decode column names.  Column names are (gridName)$(columnName)
				
			/* jsonrpc holds the JSON RPC url.  This url is used for sending data to and from this library.
			 * without this url nothing will work.  This is usually set in the PHPSlickGrid helper and must point
			 * to the appropriate action in the controller. */
			jsonrpc : null,     	// JSON RPC URL
				
			/* Pooling frequency used to keep in sync with other users */
			pollFrequency : 1000,	// 2500 = 2.5 seconds, 1000 = 1 second
				
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
			blockSize : 10,  		// Number of rows (records) to try and get per JASON RPC call.
			bufferMax : 100,		// Maximum number of rows (records) to keep at any given time.
												
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
//			var now = new Date();
//			
//			// TODO:Refactor this back to poll on light stale!!!
//
//			// If it has been more than 800ms (0.8 second)
//			// trigger the callback.
//			if ((now - self.length_lastcall) > 800) {
//				self.length_lastcall = now;
//				// Call JSON service for getLength passing self.options as
//				// options.
//				self.service.getLength(self.state, {
//					'success' : function(data) {	
//						// If the length has changed update the listeners.
//						if (data.gridLength!=self.state.gridLength) {
//							self.state.gridLength = (data.gridLength - 0);
//							// Trigger notification for grid length change
//							onRowCountChanged.notify();
//						}
//						// If the total row count changed update listeners.
//						if (data.totalRows!=self.state.totalRows) {
//							self.state.totalRows = (data.totalRows - 0);
//							// Trigger notification for grid length change
//							onRowTotalCountChanged.notify();
//						}
//					}
//				});
//			}
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
				
				// Track what rows the grid needs to update
				indices.push(start+i);
				
				// Update time/date of the newest item seen.
				if (typeof data[i][self.state.upd_dtm_col] != 'undefined') 
					if (String(data[i][self.state.upd_dtm_col]) > String(self.state.newestRecord))
						self.state.newestRecord = data[i][self.state.upd_dtm_col];
				
				// Maintain our buffer size limit
				while (self.state.active_buffers.length>=self.state.blocksMax) {
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
			
			
			if (typeof self.buffer["k"+row] == 'undefined') {
				for( var i=0; i<self.state.blockSize; i++) {
					if (typeof self.buffer["k"+(row+i)] == 'undefined') {
						self.buffer["k"+(row+i)] = new Array();
						fetchSize++;
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
						
			self.service.resetState(self.state, {
				'success' : function(state) {	
					self.state = $.extend(true, {}, self.state, state);
				}
			});			
		
			self.state.active_buffers 	= [];
			self.state.activeKeys 		= [];		
			
			self.buffer 		= new Array();
			self.reverseLookup 	= new Array();
		}

		function setSort(sortarray) {
			self.state.order_list = sortarray;
		}
		
		function updateItem(item) {
			// Don't let the user move on until the row has been saved.  
			self.service.setAsync(false);
			var data = self.service.updateItem(item, self.state);
			// update buffers
			updateBuffers(data);
			self.service.setAsync(true);
		}

		function addItem(item) {
			// Don't let the user move on until the row has been saved.  
			self.service.setAsync(false);
			//self.lengthdate=0; // force new length
			var data = self.service.addItem(item, self.state);
			//lengthAction(data);
			updateBuffers(data);
			self.service.setAsync(true);
		}
		
		function deleteItem(item) {
			self.service.setAsync(false);
			var data = self.service.deleteItem(item, self.state);
			//lengthAction(data);
			updateBuffers(data);
			self.service.setAsync(true);
		}		
		
		
		function updateBuffers(data) {
			
			// Update the records in our buffers
			var len = data['updatedRows'].length;
			var indices = new Array();
			// Loop through our updated rows
			for (var i=0;i<len;i++) {
				data['updatedCells'] = new Array();
				
				// If new row give it a place to live and update gridLength
				if (data['updatedRows'][i][self.state.primay_col]>self.state.maxPrimary) {
					// Give our new row a place to live at the end of the buffer.
					self.reverseLookup["k" + data['updatedRows'][i][self.state.primay_col]] = ++self.state.gridLength;
					self.state.maxPrimary = data['updatedRows'][i][self.state.primay_col];
					LengthUpdated = true;
				}
				
				// if we can lookup the slickgrid row then update it, else ignore it.
				if (typeof self.reverseLookup["k"+data['updatedRows'][i][self.state.primay_col]]!='undefined') {
					// get the slickgrid index (idx)
					var row=self.reverseLookup["k"+data['updatedRows'][i][self.state.primay_col]];
					
					

					// calculate the current block
					//var block = Math.floor(idx / self.state.blockSize);
					// calculate the index inside the current block
					//var blockIdx = idx % self.state.blockSize;
					
					var offset_row 	= row;		// Default to top row offset.
					var type 		= 't';	// Default to top buffers.
					
					// If row was created after our last sort/refresh
					// switch to bottom buffers.
					if (row >= self.state.top_length) {
						// Calculate the bottom buffer
						offset_row = row - self.state.top_length;
						type = 'b';
						//console.log("Bottom buffer add");
					}
							
					var block = type+(Math.floor(offset_row / self.state.blockSize));
					var idx = offset_row % self.state.blockSize;
					
					
		            // update the row in our cache
		            // find the updated cell
		            //console.log(idx);
					
					//TODO: Refactor this?
		            //data['updatedCells'].push({idx:idx, columns:updated_cell(self.pages[block].data[blockIdx],data['updatedRows'][i])});
		            //console.log(updated_cell(self.pages[block].data[blockIdx],data['updatedRows'][i]));
		            //console.log(self.pages[block].data[blockIdx]);
		            
		            // Make sure we don't run off the end of a block 
		            // due to deletes or un-deletes.
		            if (typeof(self.pages[block])!='undefined') {
		            	self.pages[block].data[idx]=data['updatedRows'][i];
		            	// Track the grid rows we update 
						indices.push(row);
		            }
		            	            
				}
				// update our newest record if needed.
				if (String(self.state.newestRecord) < String(data['updatedRows'][i][self.state.upd_dtm_col]))
	            	self.state.newestRecord=data['updatedRows'][i][self.state.upd_dtm_col];			           
	            
			}
			
			// Tell all subscribers (ie slickgrid) the data change changed for this block	
        	if (indices.length>0)
        		onRowsChanged.notify({rows: indices}, null, self);
		}
		
		function updateLength(data) {	
			if (self.state.gridLength!=data['datalength']['gridLength']) {
				
				self.state.gridLength=data['datalength']['gridLength'];
				self.length_lastcall = new Date();
				
				onRowCountChanged.notify();
			}
		}
		
		// If we have a pollFrequency should we poll the server.
		if (self.state.pollFrequency) {
		
			function SyncController(data) {

				
				//console.log("sync");
				console.log(data);
				
				var len = data['UpdatedRows'].length;
				var indices = new Array();
				// Loop through our updated rows
				for (var i=0;i<len;i++) {
					var row = self.reverseLookup["k" + data['UpdatedRows'][i][self.state.primay_col]];
					self.buffer["k"+row]=data['UpdatedRows'][i];
					indices.push(row);
					if (String(self.state.maxDateTime) < String(data['UpdatedRows'][i][self.state.upd_dtm_col]))
		            	self.state.maxDateTime=data['UpdatedRows'][i][self.state.upd_dtm_col];		
				}
				
				if (indices.length > 0) {
					onRowsChanged.notify({rows: indices}, null, self);
				}
				
				
				
				
//				updateLength(data);

//				updateBuffers(data);
								
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
			//console.log("getItemMetadata :)"+row);
			if (row==1)
				return {
					"selectable":false,
					"focusable":false,
					"cssClasses":"disabled"
				};
				
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
			//"onSync" : onSync,
			//"addPollRequestData" : addPollRequestData,
			"getItemMetadata" : getItemMetadata,
			"setSort" : setSort,
			"invalidate" : invalidate

		};
	}
})(jQuery);
