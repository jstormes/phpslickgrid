(function($) {
	// register namespace
	$.extend(true, window, {
		"PHPSlickGrid" : {
			"HeaderPlugins" : {
				"MenuButton" : MenuButton
			}
		}
	});
	
	function MenuButton(grid, data, options) {
		
		
		
		var MenuItems = [];
	
		var _handler = new Slick.EventHandler(); // Internal event handler
		
		var HeaderCellRender 		= new Slick.Event();
		var BeforeHeaderCellDestroy = new Slick.Event();
		
		var $dialog=null; // div of the dialog box.
		
		function init(grid) {
		  var _defaults = {};
	      options = $.extend(true, {}, _defaults, options);
	      _grid = grid;
	      _handler
	        .subscribe(_grid.onHeaderCellRendered, handleHeaderCellRendered)
	        .subscribe(_grid.onBeforeHeaderCellDestroy, handleBeforeHeaderCellDestroy);

	      // Force the grid to re-render the header now that the events are hooked up.
	      _grid.setColumns(_grid.getColumns());
	      
	      // Hide the menu on outside click.
	      $(document.body).bind("mousedown", handleBodyMouseDown);
		}
		
		function destroy() {
			// un-hook event handler
			_handler.unsubscribeAll();
			// un-hook mouse down outside of filter menu from menu logic
			$(document.body).unbind("mousedown", handleBodyMouseDown);
		}
		
		function handleBodyMouseDown(e) {
			// the the mouse click in not in our filter menu
			// hide the menu.
			if ($dialog && $dialog[0] != e.target
					&& !$.contains($dialog[0], e.target)) {
				hideDialog();
			}
		}	
		
		function registerPlugin(item) {
			MenuItems.unshift(item);
			item.init(self);
		}
		
		/**
		 * When grid.setColumn() this function is called for each
		 * header cell.
		 */
		function handleHeaderCellRendered(e, args) {
			
			//console.log(options['columns']);
			
			var AddToColumn=true;
			
			// options['columns']!=null;
				// if !in options['columns'] {
					// AddToColumn=false;
			
			// foreach MenuItem
				// if MenuItem.ApplitesTo(args) {
					// AddToColumn=true;
			    // else
			        // AddToColumn=false;
			
			// If the column is eligable for the button add it.
			if (AddToColumn) {
				var column = args.column;
				var grid = args.grid;
				var node = args.node;
				
				// Make sure we have a container for our buttons
				var $el=$("#"+args.node.id).find(".headerbuttons");
				if ($el.length==0)
					// Create a container in the header cell for our buttons if we don't have one
					$el = $("<div></div>").addClass("headerbuttons").appendTo(args.node);
					
				// insert button icon into header
				var $icon = $("<div>"+options.icon+"</div>").addClass("buttonicon").data("column", column);
				$el.append($icon);
				
				
				// bind click event of the icon to showDialog()
				$icon.bind("click", showDialog);
			}
				
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
			
			Slick.GlobalEditorLock.commitCurrentEdit();
			
			var $dialogButton = $(this);
			var activeColumn = $dialogButton.data("column");
			
			console.log(activeColumn);
			
			// Mark the header as active to keep the highlighting.
			$activeHeaderColumn = $dialogButton.closest(".slick-header-column");
			$activeHeaderColumn.addClass("slick-header-column-active");
			
			// Create the dialog box <div>
			if (!$dialog) {
				$dialog = $("<div class='phpslick-headerdialog-menu'></div>")
						.appendTo(document.body);
			}

			// Position the dialog box.
			$Left = $(this).offset().left;
			if (($Left+252)>$(window).width())
				$Left=$(this).offset().left-252;
		    $dialog.css("top", $(this).offset().top + $(this).height()).css(
						"left", $Left);
			

			// Build the title bar for the menu
			// make the hover give details of database.
			hover = "MySQL column name: " + activeColumn.field + "\n";
			hover += "MySQL column type: " + activeColumn.sql_type;
			
			var $li = $(
				"<div style='color:white;text-align:center;background:gray;margin:0;padding:0;'></div>")
				.attr("title", hover).text(activeColumn.name+' ').appendTo($dialog);
	
			var $close =$("<div style='float:left'> &nbsp; X</div>")
				.appendTo($li)
				.click(function() {
					hideDialog();
				});
			
			
			// Foreach grid dialog in column dialog array
			// Add dialog to div
			//alert("Show dialog");
			
			// Stop propagation so that it doesn't register as a header click
			// event.
			e.preventDefault();
			e.stopPropagation();
		}
		
		function hideDialog() {
			if ($dialog) {
				$dialog.remove();
				$dialog = null;
				$activeHeaderColumn.removeClass("slick-header-column-active");
			}
			
			// hide all plugins
			//for(var i = 0; i < plugins.length; i++){
			//	if (typeof plugins[i].hide != 'undefined')
			//		plugins[i].hide(activeColumn,$activeHeaderColumn);
			//}
			
			//_grid.setColumns(_grid.getColumns());
			
		}
		
		

	
	
		$.extend(this, {
			"init" : init,
			"destroy" : destroy,
			//"hideDialog" :hideDialog,
			"registerPlugin": registerPlugin
			//"getGrid": getGrid,

			//"onBeforeMenuShow" : new Slick.Event()
			//"onBeforeMenuHide" : new Slick.Event()
	
		});
	}
})(jQuery);