/**
 * This class mirrors a PHPSlickGrid.JSON.DataCache object.
 * 
 * The idea is that you have two grid on the same page, the data
 * object may or may not be instantiated yet.  This class will look
 * for the object, if found call it's methods, if not return reasonable 
 * empty vales.  
 * 
 */

(function($) {
	$.extend(true, window, {
		PHPSlickGrid : {
			JSON : {
				DataMirror : DataMirror
			}
		}
	});

	function DataMirror(DataObjectToMirror) {

		var self = this;
		var defined=false;

		// events
		var onRowCountChanged = new Slick.Event();
		var onRowsChanged = new Slick.Event();
	
		// function getLength
		function getLength() {
			if (defined)
				return window[DataObjectToMirror].getLength();
			else
				return 0;
		}

		function getItem(item) {
			if (defined)
				return window[DataObjectToMirror].getItem(item);
			else
				return null;
		}

		function updateItem(item) {
			if (defined)
				return window[DataObjectToMirror].updateItem(item);
			else
				return null;
		}

		function addItem(item) {
			if (defined)
				return window[DataObjectToMirror].addItem(item);
			else
				return null;
		}
		
		function deleteItem(item) {
			if (defined)
				return window[DataObjectToMirror].deleteItem(item);
			else
				return null;
		}

		function invalidate() {
			if (typeof window[DataObjectToMirror] != 'undefined')
				return window[DataObjectToMirror].invalidate();
		}

		function setSort(sortarray) {
			if (defined)
				return window[DataObjectToMirror].setSort(sortarray);
			else
				return null;
		}
		
		/**
		 * Poll for the datacache object to "appear" in the global name space.
		 */
		function attachToObject() {
			if (typeof window[DataObjectToMirror] != 'undefined') {
				
				window[DataObjectToMirror].onRowCountChanged.subscribe(function (e, args) { 
					onRowCountChanged.notify();
				});
				
				window[DataObjectToMirror].onRowsChanged.subscribe(function (e, args) { 
					onRowsChanged.notify(args);
				});
				
				defined=true;
				
				onRowCountChanged.notify();

				return true;
			}
			else {
				setTimeout(attachToObject,50);
				return false;
			}
		}

		attachToObject();

		return {

			// data provider methods
			"getLength" : getLength,
			"getItem" : getItem,
			"addItem": addItem,
			"updateItem": updateItem,
			"onRowCountChanged" : onRowCountChanged,
			"onRowsChanged" : onRowsChanged,
			"setSort" : setSort,
			"invalidate" : invalidate

		};
	}
})(jQuery);