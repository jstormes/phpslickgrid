(function($) {
	// register namespace
	$.extend(true, window, {
		"PHPSlickGrid" : {
			"HeaderPlugins" : {
				"MenuItems" : {
					"HTML": HTML
				}
				
			}
		}
	});
	
	
	
	function HTML(options) {
		
		var html=null;
		
		function init(parent) {
			console.log("PHPSlickGrid.HeaderPlugin.MenuItems.HTML.init() = "+html);
		}
		
		function destroy(parent) {
			
		}
		
		function appliesToColumn(args) {

			// hide from column for testing.
			//if (args.column.name=="A")
			//	return false;
			
			return true;
		}
		
		function showDialog($dialog,activeColumn,$activeHeaderColumn,parent) {
			$item_div=$("<div>SimpleFilter</div>").appendTo($dialog);
		}
		
		function setHTML(shtml) {
			html = shtml;
		}
 		
		function hideDialog() {
			
		}
		
		$.extend(this, {
			"init" : init,
			"showDialog" : showDialog,
			"setHTML" : setHTML,
			"destroy" : destroy,
			"hideDialog" :hideDialog,
			"appliesToColumn" : appliesToColumn
			//"getGrid": getGrid,

			//"onBeforeMenuShow" : new Slick.Event()
			//"onBeforeMenuHide" : new Slick.Event()
	
		});
	}
})(jQuery);
	