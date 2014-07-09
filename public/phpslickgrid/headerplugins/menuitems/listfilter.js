(function($) {
	// register namespace
	$.extend(true, window, {
		"PHPSlickGrid" : {
			"HeaderPlugins" : {
				"MenuItems" : {
					"ListFilter": ListFilter
				}
				
			}
		}
	});
	
	
	
	function ListFilter(data, options) {
		
		
		function init(parent) {
			
		}
		
		function destroy(parent) {
			
		}
		
		function appliesToColumn(args) {			
			return true;
		}
		
		function showDialog($dialog) {
			$item_div=$("<div>ListFilter</div>").appendTo($dialog);
		}
		
 		
		function hideDialog() {
			
		}
		
		$.extend(this, {
			"init" : init,
			"showDialog" : showDialog,
			"destroy" : destroy,
			"hideDialog" :hideDialog,
			"appliesToColumn" : appliesToColumn
			//"getGrid": getGrid,

			//"onBeforeMenuShow" : new Slick.Event()
			//"onBeforeMenuHide" : new Slick.Event()
	
		});
	}
})(jQuery);
	