(function($) {
	// register namespace
	$.extend(true, window, {
		"PHPSlickGrid" : {
			"HeaderMenu" : HeaderMenu
		}
	});
	
	function HeaderMenu(grid, data, options) {
		
		var MenuItem = [];
	
		var _handler = new Slick.EventHandler(); // Internal event handler
		
		var HeaderCellRender 		= new Slick.Event();
		var BeforeHeaderCellDestroy = new Slick.Event();
		
		//_handler.subscribe(grid.onHeaderCellRendered,handleHeaderCellRendered)
		//.subscribe(grid.onBeforeHeaderCellDestroy,handleBeforeHeaderCellDestroy);
		
		//grid.setColumns(grid.getColumns());
		
		function init(grid) {
	      options = $.extend(true, {}, _defaults, options);
	      _grid = grid;
	      _handler
	        .subscribe(_grid.onHeaderCellRendered, handleHeaderCellRendered)
	        .subscribe(_grid.onBeforeHeaderCellDestroy, handleBeforeHeaderCellDestroy);

	      // Force the grid to re-render the header now that the events are hooked up.
	      _grid.setColumns(_grid.getColumns());

	      // Hide the menu on outside click.
	      //$(document.body).bind("mousedown", handleBodyMouseDown);
		}
		
		function registerMenuItem(item) {
			MenuItem.unshift(item);
			MenuItem.init(self);
		}
		
		function handleHeaderCellRendered(e, args) {
			
			var column = args.column;
			var grid = args.grid;
			var node = args.node;
			
			// find the space for our header menu icons
			var $el=$("#"+args.node.id).find(".headermenusg");
			if ($el.length==0) 
				// Create a space in the header cell for our menu if we don't have one
				$el = $("<div></div>").addClass("headermenusg").appendTo(args.node);
			
			// insert icon into header
			var $icon = $("<div>"+options.icon+"</div>").addClass("headericon");
			$el.append($icon);
			
			// bind click event of the icon to showDialog()
			$icon.bind("click", showDialog);
				
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
		
		function showDialog(e) {
			// Foreach grid dialog in column dialog array
			// Add dialog to div
			alert("Show dialog");
			
			// Stop propagation so that it doesn't register as a header click
			// event.
			e.preventDefault();
			e.stopPropagation();
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