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

		console.log(options);
		var defaults = {
			jsonrpc : null,     	// JSON RPC url
			upd_dtm_col : null, 	// Timestamp column, used to keep track of when to "update" the column values.
			primay_col : null,  	// Column name of the primary key. used used for hashing array for quick lookup.
			blockSize : 100,  		// Size of a block in rows (records).
			blocksMax : 10,  		// Maximum number of blocks to keep at any given time.
			pollFrequency : 10000,	// 2500 = 2.5 seconds, 1000 = 1 second
			order_list : {},		// Current sort orders
			filters : new Array(),  // Curent filters
			gridName : 'grid', 		// Used to tie back to Zend_Session.  (Depreciated)
			gridLength : 0			// Length of current grid in rows or (rows + 1) if we can add rows.(Depreciated)
		};

		// Merge defaults with passed options.
		self.options = $.extend(true, {}, defaults, options);
		
		// events
		var onRowCountChanged = new Slick.Event();
		var onRowsChanged = new Slick.Event();

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

			// If it has been more than 1000ms (1 second)
			// trigger the getlength callback.
			if (now - self.lengthdate > 1000) {
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
			var newestRecord = self.options.newestRecord;
			
			self.activeBuffers.push(block);
            //console.log('active buffers '+self.activeBuffers);
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
			//console.log("record cnt "+len);
			for ( var i = 0; i < len; i++) {
				//console.log(self.pages[block].data[i][self.options.upd_dtm_col]);
				indices[i] = (block * blockSize) + i;
				// Store the date time of the newest record, we use this later
				// to see if
				// we need to refresh the block, column must be named updt_dtm
				// in the db.
				
				if (typeof self.pages[block].data[i][self.options.upd_dtm_col] != 'undefined') {
					console.log("Updated ldt "+self.pages[block].data[i][self.options.upd_dtm_col]+" > "+self.pages[block].updt_dtm);
					if (String(self.pages[block].data[i][self.options.upd_dtm_col]) > String(self.pages[block].updt_dtm)) {
						console.log("Newest dt: "+self.pages[block].data[i][self.options.upd_dtm_col]);
						self.pages[block].updt_dtm = self.pages[block].data[i][self.options.upd_dtm_col];
					}
				}

				// primay key mapping to indices
				self.reverseLookup["k"
						+ self.pages[block].data[i][self.options.primay_col]] = (block * blockSize)
						+ i;
			}
			//console.log(self.reverseLookup);
			//console.log(self.pages[block].updt_dtm);
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
						//console.log(block);
					}
				});
			}

			// return whatever we have.
			return self.pages[block].data[idx];
		}

		function updateItem(item) {
			console.log("updateItem in datachace.js");
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
			
			
			
			function poll_response(data) {
				console.log("refresh_buffers(data)");
				console.log(self.newestRecord);
				
				// Update the records in our buffers
				var len = data['updatedRows'].length;
				console.log(len);
				var indices = new Array();
				// Loop through our updated rows
				for (var i=0;i<len;i++) {
					console.log(data['updatedRows'][i][self.options.upd_dtm_col]);
					// if we can lookup the slickgrid row then update it, else ignore it.
					if (typeof self.reverseLookup["k"+data['updatedRows'][i][self.options.primay_col]]!='undefined') {
						// get the slickgrid index (idx)
						var idx=self.reverseLookup["k"+data['updatedRows'][i][self.options.primay_col]];
						// Track the rows we update for later.
						indices[i]=idx;
						// calculate the block and offset.
						var block=Math.floor(idx/10);
			            var blockIdx=idx%10;
			            // update the row in our cache
			            self.pages[block].data[blockIdx]=data['updatedRows'][i];
			            // update our newest record if needed.
			            console.log(data['updatedRows'][i][self.options.upd_dtm_col]);
			            if (String(self.newestRecord) < String(data['updatedRows'][i][self.options.upd_dtm_col])) 
			            	self.newestRecord=data['updatedRows'][i][self.options.upd_dtm_col];			            
					}
				}
				
				// Tell all subscribers (ie slickgrid) the data change changed for this block	
            	if (indices.length>0)
            		onRowsChanged.notify({rows: indices}, null, self);
            	
            	console.log(self.newestRecord);
            	
				setTimeout(new_poll, self.options.pollFrequency);
			}
			
			function new_poll() {
				
				var pollRequest={'options':self.options,'buffers':self.activeBuffers,'buffer_ldt':self.newestRecord};
				
				self.service.SyncDataCache(pollRequest,{'success':function(data) {poll_response(data); },
				'error' : function(data) {setTimeout(new_poll, self.options.pollFrequency); }, 
				'exceptionHandler' : function(data) {setTimeout(new_poll, self.options.pollFrequency); }
				});
			}
			
			// Kick off the polling
			console.log("Starting poll service");
			new_poll();
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
			"setSort" : setSort,
			"invalidate" : invalidate

		};
	}
})(jQuery);