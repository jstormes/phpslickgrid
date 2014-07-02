(function($) {
	// register namespace
	$.extend(true, window, {
		"PHPSlickGrid" : {
			"HeaderMenu" : {
				"HTML": HTML
			}
		}
	});
	
	function HTML(data, options) {
		
		function init(grid) {
			
		}
		
		
		$.extend(this, {
			"init" : init
			//"destroy" : destroy,
			//"hideDialog" :hideDialog,
			//"getGrid": getGrid,

			//"onBeforeMenuShow" : new Slick.Event()
			//"onBeforeMenuHide" : new Slick.Event()
	
		});
	}
})(jQuery);
	