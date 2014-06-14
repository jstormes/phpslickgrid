(function($) {
	// register namespace
	$.extend(true, window, {
		"PHPSlickGrid" : {
			"HeaderMenu" : HeaderMenu
		}
	});
	
	function HeaderMenu(grid, data, options) {
	
		var _handler = new Slick.EventHandler(); // Internal event handler
		
		var HeaderCellRender 		= new Slick.Event();
		var BeforeHeaderCellDestroy = new Slick.Event();
		
		_handler.subscribe(grid.onHeaderCellRendered,handleHeaderCellRendered)
				.subscribe(grid.onBeforeHeaderCellDestroy,handleBeforeHeaderCellDestroy);
		
		grid.setColumns(grid.getColumns());
		
		function handleHeaderCellRendered(e, args) {
			
			// find the space for our header menu icons
			var $el=$("#"+args.node.id).find(".headermenusg");
			if ($el.length==0) 
				// Create a space in the header cell for our menu if we don't have one
				$el = $("<div></div>").addClass("headermenusg").appendTo(args.node);


			
			$el.append($("<div>"+options.icon+"</div>").addClass("headericon"));
			
			
			
			
			
			
			
//			
			
			//
			
//			var hdr_id = args.node.id;
//			var $hdr = $('.'+args.node.id);
			
//			if($("." + args.node.id).find(".headermenusg").length == 0) {
//				console.log("Found");
//			}
//			console.log($hdr.find(".asdf"));
//			if ($hdr.find(".headermenusg"))
//				console.log("Found");
//			var $el = $("<div><i style='font-family:FontAwesome;' class='fa fa-caret-down'></i></div>");//.addClass(
//			"phpslick-headerdialog-menubutton").data("column", column);
			
			
		}
		
		function handleBeforeHeaderCellDestroy(e, args) {
			
		}
		
		function addDialog(dialogHanler, column) {
			
		}
		
		function invalidate() {
			// Force the grid to re-render the header now that the events are
			// hooked up.
			grid.setColumns(grid.getColumns());
		}
		
		function showDialog() {
			// Foreach grid dialog in column dialog array
			// Add dialog to div
		}
		
		function hideDialog() {
			// foreach grid dialog in column dialog array
			// distroy dialog
			
		}
		
		console.log("Hello World I am HeaderMenu");

	
	
		$.extend(this, {
			//"init" : init,
			//"destroy" : destroy,
			//"hideDialog" :hideDialog,
			//"registerPlugin": registerPlugin, 
			//"getGrid": getGrid,

			//"onBeforeMenuShow" : new Slick.Event()
			//"onBeforeMenuHide" : new Slick.Event()
	
		});
	}
})(jQuery);