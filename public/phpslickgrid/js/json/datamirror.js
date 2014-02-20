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


		// events
		var onRowCountChanged = new Slick.Event();
		var onRowsChanged = new Slick.Event();

		// function getLength
		function getLength() {
//			console.log(typeof eval(DataObjectToMirror));
//			return DataObjectToMirror['getLength']();
			if (typeof window[DataObjectToMirror] != 'undefined') {
				console.log("DataObjectToMirror['getLength'] != 'undefined'");
				return window[DataObjectToMirror].getLength();
			}
			return (0);
		}


		function getItem(item) {

			// return whatever we have.
			return [];
		}

		function updateItem(item) {

		}

		function addItem(item) {

		}
		
		function deleteItem(item) {

		}

		function invalidate() {

		}

		function setSort(sortarray) {

		}

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