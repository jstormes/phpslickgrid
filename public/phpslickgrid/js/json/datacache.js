/* This class provides a virtual real-time cached access to the sorted and filtered
 * table (PHPSlickGrid_Db_Table_Abstract) from the server.
 * 
 * Concepts:
 * =========
 * 
 * Buffer "top"    - Top of buffer space, up to the max primary.  Will have
 *                   the sorted records from the last sort or refresh.
 *                   
 * Buffer "bottom" - Bottom of the buffer space, anything over the max
 *                   primary.  Will have the unsorted records added after the
 *                   last sort or refresh.
 *                   
 * Active Buffers  - Active buffer blocks, only the active blocks are kept in
 *                   browser memory.  All other blocks must be pulled from the server.
 *                   Only a limited number of blocks can be active at any given time.
 *                   
 * Buffer          - A block of records kept in local browser memory for quick access.
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
				jsonrpc : null,     	// JSON RPC URL
				upd_dtm_col : null, 	// Time stamp column, used to keep track of when to "update" the column values.
				primay_col : null,  	// Column name of the primary key. used used for hashing array for quick lookup.
				maxPrimary : null,		// Maximum primary key so far.  Anything after this will be "new".
				blockSize : 100,  		// Size of a block in rows (records).
				blocksMax : 10,  		// Maximum number of blocks to keep at any given time.
				pollFrequency : 100000,	// 2500 = 2.5 seconds, 1000 = 1 second
				order_list : {},		// Current sort order
				filters : new Array(),  // Current filters
				gridName : 'grid', 		// Grid name used to decode column names.  Column names are (gridName)$(columnName)
				gridLength : 0,			// *Length of current grid in rows or (rows + 1) if we can add rows.(Depreciated)
				newestRecord : 0,		// Date time of the newest record in the buffers
				top_length : null,      // Length of the top buffer.
				gross_length : null,	// Total number of rows in grid aka filtered length.
				unfiltered_length : null,// Length of gird if un-filtered.
				active_buffers : []		// Array of active buffers
			};
		
		// Prime the state default state + inital state from server.
		self.state = $.extend(true, {}, default_state, inital_state);
		
		// if we were passed a gross length use it.
		if (self.state.gross_length !== null)
			self.length_lastcall = new Date();
		
		// Set top of the buffer to the current grid length.
		self.state.top_length = self.state.gridLength;
		
		// events
		var onRowCountChanged = new Slick.Event();
		var onRowsChanged = new Slick.Event();
		var onSync = new Slick.Event();
		var onRowTotalCountChanged = new Slick.Event();
		
		// Pages of our data
		self.pages = new Array();			// Active Buffer
		self.reverseLookup = new Array();	// Reverse lookup hash index['k'+primary key from db] = row in slickgrid.
		
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
//			// Refactor this to only use state!!!!!!!!
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
		
		function getBlock(block, data) {
			
			console.log("Processing Block "+block);
			console.log(data);
			
			// Maintain our buffer size limit
			self.state.active_buffers.push(block);
            if (self.state.active_buffers.length>=self.state.blocksMax) {
	            var toRemove=self.state.active_buffers.shift(block);
	            delete self.pages[toRemove];
            }

			self.pages[block] = new Object();
			self.pages[block].data = data;
			
			// Create array of updated indices
			var indices = new Array();
			
			var block_offset = (block.slice(1) * self.state.blockSize);
			
			if (block.charAt(0)=='t') {
				
				
				console.log("block_offset "+block_offset);
				console.log(self.pages[block]);
				
				var len = self.pages[block].data.length;
				
				console.log("block length "+len);
				for ( var i = 0; i < len; i++) {
					// Track changed rows.
					indices.push( block_offset + i );
					
					// Update time/date of the newest item seen.
					if (typeof self.pages[block].data[i][self.state.upd_dtm_col] != 'undefined') 
						if (String(self.pages[block].data[i][self.state.upd_dtm_col]) > String(self.state.newestRecord))
							self.state.newestRecord = self.pages[block].data[i][self.state.upd_dtm_col];

					// primary key mapping to row self.reverseLookup["k"+primary_key_value]=row
					self.reverseLookup["k" + self.pages[block].data[i][self.state.primay_col]] = block_offset + i;
				}
			}
//			else {
//				var block_offset = (block.slice(1) * self.state.blockSize) + i + self.state.top_length;
//				
//				var len = self.pages[block].data.length;
//				for ( var i = 0; i < len; i++) {
//				
//					// Look to see if item has a row already
//					if (typeof self.reverseLookup["k"+self.pages[block].data[i][self.state.primay_col]]=='undefined') {
//						self.reverseLookup["k" + self.pages[block].data[i][self.state.primay_col]] = ++self.state.gridLength;
//					}
//				}
//			}
//			var block_offset = (block.slice(1) * self.state.blockSize);
//			if (block.charAt(0)=='b')
//				block_offset = (block.slice(1) * self.state.blockSize) + i + self.state.top_length;
			
			
			
//			var len = self.pages[block].data.length;
//			for ( var i = 0; i < len; i++) {
//				// Track changed rows.
//				indices.push( block_offset + i );
//				
//				// Store the date time of the newest record, we use this later
//				// to see if
//				// we need to refresh the block, column must be named updt_dtm
//				// in the db.
//				
//				if (typeof self.pages[block].data[i][self.state.upd_dtm_col] != 'undefined') 
//					if (String(self.pages[block].data[i][self.state.upd_dtm_col]) > String(self.state.newestRecord))
//						self.state.newestRecord = self.pages[block].data[i][self.state.upd_dtm_col];
//
//				// primary key mapping to row self.reverseLookup["k"+primary_key_value]=row
//				self.reverseLookup["k" + self.pages[block].data[i][self.state.primay_col]] = block_offset + i;
//			}
//			console.log(self.state.newestRecord);
			
			console.log("Rows to update");
			console.log(indices);

			// Tell all subscribers (ie slickgrid) the data change changed for
			// this block
			onRowsChanged.notify({
				rows : indices
			}, null, self);
		}
		
		function getItem(row) {
			console.log("getting Row "+row);

			var offset_row 	= row;		// Default to top row offset.
			var type 		= 't';	// Default to top buffers.
			
			// If row was created after our last sort/refresh
			// switch to bottom buffers.
			if (row >= self.state.top_length) {
				// Calculate the bottom buffer
				offset_row = row - self.state.top_length;
				type = 'b';
			}
					
			var block = type+(Math.floor(offset_row / self.state.blockSize));
			var idx = offset_row % self.state.blockSize;
			
			console.log("in Block "+block );
						
			
			
			// if we don't have the requested block, send AJAX request for it.
			// Send only one request per block.
			if (typeof self.pages[block] == 'undefined') {
				console.log("Getting Block "+block);
				self.pages[block] = new Object();
				self.pages[block].data = new Array();
				self.service.getBlock(block, self.state, {
					'success' : function(data) {
						getBlock(block, data);
					}
				});
			}

			// return whatever we have.
			return self.pages[block].data[idx];
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

		function invalidate() {
			self.datalength = null;
			self.pages = [];
			self.reverseLookup = [];
			self.state.activeBuffers = [];
			self.state.newestRecord='0';
		}

		function setSort(sortarray) {
			self.state.order_list = sortarray;
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
						console.log("Bottom buffer add");
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

				console.log("sync");
				console.log(data);
//				updateLength(data);

//				updateBuffers(data);
								
//				setTimeout(SyncRequest, self.state.pollFrequency);
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
			SyncRequest();
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
			//"setSort" : setSort,
			"invalidate" : invalidate

		};
	}
})(jQuery);
