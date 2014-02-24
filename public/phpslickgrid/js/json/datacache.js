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
			jsonrpc : null,
			upd_dtm_col : null,
			primay_col : null,
			blockSize : 100,
			bufferSize : 10,
			pollFrequency : 1000000, // 1000 Seconds
			gridName : 'grid', // Used to tie back to Zend_Session.
			order_list : {},
			where_list : new Array(),
			gridLength : 0
		};

		self.options = $.extend(true, {}, defaults, options);

		// events
		var onRowCountChanged = new Slick.Event();
		var onRowsChanged = new Slick.Event();

		// Pages of our data
		self.pages = new Array();
		self.reverseLookup = new Array();
		self.newestRecord = '0';
		
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

			self.pages[block] = new Object();
			self.pages[block].data = data;

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
					if (self.pages[block].data[i][self.options.upd_dtm_col] > self.pages[block].updt_dtm)
						self.pages[block].updt_dtm = self.pages[block].data[i][self.options.upd_dtm_col];

				// primay key mapping to indices
				self.reverseLookup["k"
						+ self.pages[block].data[i][self.options.primay_col]] = (block * blockSize)
						+ i;
			}
			// Keep a record of the newest record we have seen
			if (newestRecord < self.pages[block].updt_dtm)
				newestRecord = self.pages[block].updt_dtm;

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
			self.service.addItem(item, self.options);
		}
		
		function deleteItem(item) {
			self.service.deleteItem(item, self.options);
		}

		function invalidate() {
			self.datalength = null;
			self.pages = [];
			self.reverseLookup = [];
			// self.activeBuffers = [];
			// self.newestRecord='0';
		}

		function setSort(sortarray) {
			self.options.order_list = sortarray;
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