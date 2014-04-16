(function($) {
	$.extend(true, window, {
		PHPSlickGrid : {
			JSON : {
				DataCache : DataCache
			}
		}
	});

	function DataCache(options) {

		var self = this;

		var defaults = {
			jsonrpc : null,     	// JSON RPC URL
			upd_dtm_col : null, 	// Time stamp column, used to keep track of when to "update" the column values.
			primay_col : null,  	// Column name of the primary key. used used for hashing array for quick lookup.
			max_primary : null,		// Maximum primary key.
			blockSize : 100,  		// Size of a block in rows (records).
			blocksMax : 10,  		// Maximum number of blocks to keep at any given time.
			pollFrequency : 10000,	// 2500 = 2.5 seconds, 1000 = 1 second
			order_list : {},		// Current sort order
			filters : new Array(),  // Current filters
			gridName : 'grid', 		// Grid name used to decode column names.  Column names are (gridName)$(columnName)
			gridLength : 0			// Length of current grid in rows or (rows + 1) if we can add rows.(Depreciated)
		};

		// TODO: change self.options to self.state as we want to use 
		// this as a "object" we can pass back to server as our cache "state" 
		
		// Merge defaults with passed options.
		self.options = $.extend(true, {}, defaults, options);
		
		// events
		var onRowCountChanged = new Slick.Event();
		var onRowsChanged = new Slick.Event();
		var onPollReply = new Slick.Event();

		// Track active buffers.
		self.activeBuffers = [];
		
		// Pages of our data
		self.pages = new Array();			// Active Buffer
		self.reverseLookup = new Array();	// Reverse lookup hash index['k'+primary key from db] = row in slickgrid.
		self.newestRecord = '0';			// Time stamp of the newest record in the buffers.
		
		// Check JSON URL
		$.get( self.options['jsonrpc'], function() {})
			.fail(function() {
			alert( "jsonAction() is missing from the controller or $Grid->getGridConfiguration()->jsonrpc is wrong.\n" +
					"JSON RPC URL is: "+self.options['jsonrpc'] );
			});

		// Service to call on the server side
		self.service = new jQuery.Zend.jsonrpc({
			url : self.options['jsonrpc'],
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

		// Total number of rows in our dataset
		self.datalength = (self.options['gridLength'] - 0);
		self.lengthdate = new Date();

		// function getLength
		function getLength() {
			var now = new Date();

			// If it has been more than 800ms (0.8 second)
			// trigger the getlength callback.
			if (now - self.lengthdate > 800) {
				self.lengthdate = now;
				// Call JSON service for getLength passing self.options as
				// options.
				self.service.getLength(self.options, {
					'success' : function(data) {	
						// If the length has changed update the grid.
						if (data!=self.datalength) {
							self.datalength = (data - 0);
							// Trigger notification for grid self refresh
							onRowCountChanged.notify();
						}
					}
				});
			}
			return (self.datalength - 0);
		}

		function getBlock(block, data) {
			
			var blockSize = self.options.blockSize;
			//var newestRecord = self.options.newestRecord;
			
			self.activeBuffers.push(block);
            if (self.activeBuffers.length>=self.options.blocksMax) {
	            var toRemove=self.activeBuffers.shift(block);
	            delete self.pages[toRemove];
            }

			self.pages[block] = new Object();
			self.pages[block].data = data;
			self.pages[block].updt_dtm = 0;

			// Create array of updated indices
			var indices = new Array();
			var len = self.pages[block].data.length;
			for ( var i = 0; i < len; i++) {
				indices[i] = (block * blockSize) + i;
				// Store the date time of the newest record, we use this later
				// to see if
				// we need to refresh the block, column must be named updt_dtm
				// in the db.
				
				if (typeof self.pages[block].data[i][self.options.upd_dtm_col] != 'undefined') 
					if (String(self.pages[block].data[i][self.options.upd_dtm_col]) > String(self.pages[block].updt_dtm))
						self.pages[block].updt_dtm = self.pages[block].data[i][self.options.upd_dtm_col];

				// primay key mapping to indices
				self.reverseLookup["k"
						+ self.pages[block].data[i][self.options.primay_col]] = (block * blockSize)
						+ i;
			}
			// Keep a record of the newest record we have seen
			if (self.newestRecord < self.pages[block].updt_dtm)
				self.newestRecord = self.pages[block].updt_dtm;

			// Tell all subscribers (ie slickgrid) the data change changed for
			// this block
			onRowsChanged.notify({
				rows : indices
			}, null, self);
		}

		function getItem(item) {

			// easy reference for block size
			var blockSize = self.options.blockSize;
			// currentPage = the currently requested page block
			var block = Math.floor(item / blockSize);
			// index of the item requested in the current block
			var idx = item % blockSize;

			// if we don't have the requested block, send AJAX request for it.
			// Send only one request per block.
			if (typeof self.pages[block] == 'undefined') {
				self.pages[block] = new Object();
				self.pages[block].data = new Array();
				self.service.getBlock(block, self.options, {
					'success' : function(data) {
						getBlock(block, data);
					}
				});
			}

			// return whatever we have.
			return self.pages[block].data[idx];
		}

		function updateItem(item) {
			self.service.updateItem(self.newestRecord, item, self.options);
		}

		function addItem(item) {
			self.lengthdate=0; // force new length
			self.service.addItem(item, self.options);
		}
		
		function deleteItem(item) {
			self.service.deleteItem(item, self.options);
		}

		function invalidate() {
			self.datalength = null;
			self.pages = [];
			self.reverseLookup = [];
			self.activeBuffers = [];
			self.newestRecord='0';
		}

		function setSort(sortarray) {
			self.options.order_list = sortarray;
		}
		
		
		
		// Setup polling for new data
		// if we have a pollFrequency and we have an updated timestamp/update date time
		// column we can poll.
		if ((self.options.pollFrequency)&&(self.options.upd_dtm_col)) {
			
			function updated_cell(original_row,new_row) {
				//var rows = new Array();
				var columns = new Array();
				for (propName in original_row) {
					if (new_row.hasOwnProperty(propName)) {
						if (original_row[propName]!=new_row[propName]) {
							columns.push(propName);
						}
					}
				}
				return columns;
			}
			
			function buffer_update(data) {
				
				// Update the records in our buffers
				var len = data['updatedRows'].length;
				var indices = new Array();
				// Loop through our updated rows
				for (var i=0;i<len;i++) {
					data['updatedCells'] = new Array();
					// if we can lookup the slickgrid row then update it, else ignore it.
					if (typeof self.reverseLookup["k"+data['updatedRows'][i][self.options.primay_col]]!='undefined') {
						// get the slickgrid index (idx)
						var idx=self.reverseLookup["k"+data['updatedRows'][i][self.options.primay_col]];
						// Track the rows we update for later.
						indices[i]=idx;
						// calculate the block and offset.
						//var block=Math.floor(idx/10);
			            //var blockIdx=idx%10;
						
						// TODO: Refactor the next few lines into functions
						// easy reference for block size
						var blockSize = self.options.blockSize;
						// currentPage = the currently requested page block
						var block = Math.floor(idx / blockSize);
						// index of the item requested in the current block
						var blockIdx = idx % blockSize;
						
						
			            // update the row in our cache
			            // find the updated cell
			            //console.log(idx);
						
						//TODO: Refactor this?
			            data['updatedCells'].push({idx:idx, columns:updated_cell(self.pages[block].data[blockIdx],data['updatedRows'][i])});
			            //console.log(updated_cell(self.pages[block].data[blockIdx],data['updatedRows'][i]));
			            //console.log(self.pages[block].data[blockIdx]);
			            
			            // Make sure we don't run off the end of a block 
			            // due to deletes or un-deletes.
			            if (typeof(self.pages[block]!='undefined'))
			            	self.pages[block].data[blockIdx]=data['updatedRows'][i];
			            // update our newest record if needed.
			            if (String(self.newestRecord) < String(data['updatedRows'][i][self.options.upd_dtm_col])) 
			            	self.newestRecord=data['updatedRows'][i][self.options.upd_dtm_col];			            
					}
				}
				
				// Tell all subscribers (ie slickgrid) the data change changed for this block	
            	if (indices.length>0)
            		onRowsChanged.notify({rows: indices}, null, self);
			}
			
			function length_update(data) {			
				if (self.datalength!=data['datalength']) {
					
					
					// TODO: If we have the last block in the buffer, 
					// add the new record to it, or add a new block if that
					// block is full.
					
					// Is the last block in buffer?
					// Calculate the block number of the last block
					
					// easy reference for block size
					var blockSize = self.options.blockSize;
					var lastBlock=Math.floor(self.datalength/blockSize);
					
					// TODO: REfactor this so that Updated records are passed back.
					// Loop through active blocks 
					var activeBufferCnt = self.activeBuffers.length;
					for (var i=0; i<activeBufferCnt; i++) {
						// if active block blocks include the last block
						if (self.activeBuffers[i]==lastBlock)
							// update entire last block
							console.log("update block");
						
							self.pages[lastBlock] = new Object();
							self.pages[lastBlock].data = new Array();
							self.service.getBlock(lastBlock, self.options, {
								'success' : function(data) {
									getBlock(lastBlock, data);
								}
							});
					}
					console.log(data);
					
					self.datalength=data['datalength'];
					self.lengthdate = new Date();
					
					onRowCountChanged.notify();
				}
			}
			
			// Poll controller
			// This function takes the reply from the server and passes 
			// it off to each action that might need to act on that reply.
			// TODO: Rename to Sync_Controller
			function poll_response(data) {
				
				// TODO: Rename to lengthAction(data);
				length_update(data);
				
				// TODO: Rename to buffersAction(data);
				buffer_update(data);
				
				// TODO: addAction(data);
				
				// TODO: deleteAction(data);
				
				//if (typeof(data['updatedCells'])!='undefined')
				//	console.log(data['updatedCells']);
				
				//console.log('notifying');
				
				// TODO: Rename to notifyAction(data);
				onPollReply.notify(data);
            	
				setTimeout(poll_request, self.options.pollFrequency);
			}
			
			// TODO: Rename to Sync_Failed and add data and error tracking
			function poll_fail() {
				setTimeout(poll_request, self.options.pollFrequency);
			}
			
			
			// TODO: Rename to SyncRequest()
			function poll_request() {
				
				var pollRequest={'options':self.options,'buffers':self.activeBuffers,'buffer_ldt':self.newestRecord};
				
				// TODO: Add the data from addPollRequestData data.
				
				
				self.service.SyncDataCache(pollRequest,{'success':function(data) {poll_response(data); },
				'error' : function(data) {poll_fail(); }, 
				'exceptionHandler' : function(data) {poll_fail(); }
				});
			}
			
			// Kick off the polling
			poll_request();
		}
		
		// TODO: Change to SyncInjectData($data)
		function addPollRequestData($data) {
			// TODO: Add stuff
		}
		
		function forceSync() {
			
		}

		return {

			// data provider methods
			"getLength" : getLength,
			"getItem" : getItem,
			"addItem": addItem,
			"updateItem": updateItem,
			"deleteItem": deleteItem,
			"onRowCountChanged" : onRowCountChanged,
			"onRowsChanged" : onRowsChanged,
			"onPollReply" : onPollReply,
			"addPollRequestData" : addPollRequestData,
			"setSort" : setSort,
			"invalidate" : invalidate

		};
	}
})(jQuery);