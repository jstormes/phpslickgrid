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
	
	
	
	function HTML(data, options) {
		
		var html=null;
		
		function init(parent) {
			console.log("PHPSlickGrid.HeaderPlugin.MenuItems.HTML.init() = "+html);
		}
		
		function setHTML(shtml) {
			html = shtml;
		}
 		
		
		$.extend(this, {
			"init" : init,
			"setHTML" : setHTML
			//"destroy" : destroy,
			//"hideDialog" :hideDialog,
			//"getGrid": getGrid,

			//"onBeforeMenuShow" : new Slick.Event()
			//"onBeforeMenuHide" : new Slick.Event()
	
		});
	}
})(jQuery);
	