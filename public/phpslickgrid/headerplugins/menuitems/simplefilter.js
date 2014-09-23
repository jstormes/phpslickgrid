(function($) {
	// register namespace
	$.extend(true, window, {
		"PHPSlickGrid" : {
			"HeaderPlugins" : {
				"MenuItems" : {
					"SimpleFilter": SimpleFilter
				}
				
			}
		}
	});
	
	
	
	function SimpleFilter(options, grid, data) {
		
		var self= this;
		
		var listfilter = null;
		
		var default_options ={};
		
		var node = null;
		
		self.state = $.extend(true, {}, default_options, options);
		
		var service = new jQuery.Zend.jsonrpc({url: options.jsonrpc, async:true, 
		    'error': function(data) {alert(data);},
		    'exceptionHandler': function(data) {alert(data);} });    // Simple error and exception handlers
		
		function init(parent) {
			console.log("PHPSlickGrid.HeaderPlugin.MenuItems.SimpleFilter.init() = ");
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
			
			self.node=$activeHeaderColumn;
			self.column_def = activeColumn;	// Column definition
			
			$item_div=$("<div>SimpleFilter</div>").appendTo($dialog);
			console.log("************************* SimpleFilter *************************");
			console.log(data.self.state);
			
			if (data.self.state.filters[self.column_def.field] == undefined) {
				
				//console.log("Defining column");
				listfilter = {};
				listfilter.list_filter_mode = "NOT IN";
				listfilter.list_selected = {};
				listfilter.list_filter_contains = "";
				listfilter.simple_filters = [];
				
				data.self.state.filters[self.column_def.field]=listfilter;

			}
			else {
				listfilter = data.self.state.filters[self.column_def.field];
			}
			
			
			  function invalidate() {
				
				$ParentDiv.empty();
				
				$("<div style='text-align:center;'><b>Custom Filters</b></div>").appendTo($ParentDiv);
				
				// Make sure our column has an array of filters
				if (typeof activeColumn.Filters == 'undefined')
					activeColumn.Filters = new Array();
				
				//console.log("showing simple filter");
				//console.log(activeColumn.Filters.length);
				var idx=0;
				for ( idx = 0; idx < activeColumn.Filters.length; idx++) {
					//console.log((activeColumn.Filters[idx]));
					if ((idx!=0) && (activeColumn.Filters[idx].operator!='in')) {
						$itemDiv=$("<div></div>").appendTo($ParentDiv);
						$('<input type="radio" name="andor' + idx + '" value="and" "checked" />')
							.prop('checked',(activeColumn.Filters[idx].andor == 'and')?true:false)
						    //.prop('checked',true)
							//.attr('name','andor')
							.change(filterItemClick)
							.data("activeColumn",activeColumn)
							.data("idx", idx)
							//.data("opt", $filterOptions)
							.appendTo($itemDiv);
						$('<label>And</label>').appendTo($itemDiv);
						$('<input type="radio" name="andor' + idx + '" value="or" />')
							.prop('checked', (activeColumn.Filters[idx].andor == 'or')?true:false)
						    //.prop('checked', false)
							//.attr('name', 'andor')
							.change(filterItemClick)
							.data("activeColumn",activeColumn)
							.data("idx", idx)
							//.data("opt", $filterOptions)
							.appendTo($itemDiv);
						$orText = $('<label>Or</label>').appendTo($itemDiv);
					}
					
					//console.log("activeColumn.Filters[idx].operator");
					//console.log(activeColumn.Filters);
					
					if (activeColumn.Filters[idx].operator!='in') {
						$itemDiv=$("<div></div>").appendTo($ParentDiv);
						var Options = SQLTypeToDropDownOptions(activeColumn.sql_type);
						$filterOptions = $("<select>" + Options + "</select>")
							.val(activeColumn.Filters[idx].operator)
							.attr('name','operator')
							.data("activeColumn",activeColumn)
							.data("idx", idx)
							//.data("opt", $filterOptions)
							.change(filterItemClick)
							.appendTo($itemDiv);
						$filterText = $("<input style='margin:0;padding:0;' type='text' />")
							.val(activeColumn.Filters[idx].value)
							.data("activeColumn",activeColumn)
							.data("idx", idx)
							.data("opt", FOptions)
						    .attr('name', 'searchvalue')
						    .change(filterItemClick)
						    .appendTo($itemDiv);
					}
					  
				}
				
				if (idx!=0) {
					$itemDiv=$("<div></div>").appendTo($ParentDiv);
					$('<input type="radio" name="andor' + idx + '" value="and" />')
						//.prop('checked',true)
						//.attr('name','andor')
						.change(filterItemClick)
						.data("activeColumn",activeColumn)
						//.data("opt", $filterOptions)
						.data("idx", idx)
						.appendTo($itemDiv);
					$('<label>And</label>').appendTo($itemDiv);
					$('<input type="radio" name="andor' + idx + '" value="or" />')
						//.prop('checked', false)
						//.attr('name', 'andor')
						.change(filterItemClick)
						.data("activeColumn",activeColumn)
						.data("idx", idx)
						//.data("opt", $filterOptions)
						.appendTo($itemDiv);
					$('<label>Or</label>').appendTo($itemDiv);
				}
				$itemDiv=$("<div></div>").appendTo($ParentDiv);
				var Options = SQLTypeToDropDownOptions(activeColumn.sql_type);
				$filterOptions = $("<select>" + Options + "</select>")
					.data("activeColumn",activeColumn)
					.data("idx", idx)
					//.data("opt", $filterOptions)
					.attr('name', 'operator')
					.change(filterItemClick)
					.appendTo($itemDiv);
				$filterText = $("<input style='margin:0;padding:0;' type='text' />")
					.data("activeColumn",activeColumn)
					.data("idx", idx)
					.data("opt", FOptions)
				    .attr('name', 'searchvalue')
				    .change(filterItemClick)
				    .appendTo($itemDiv);
				
				// Clear custom filters
				$itemDiv=$("<div style='margin-top:5px;'></div>").appendTo($ParentDiv);
				$("<input style='margin:0;padding:0' type='button'  value='Clear Custom Filters' />")
				.data("activeColumn",activeColumn)
				.data("idx", idx)
				.data("opt", FOptions)
				.click(clearSimpleFilter)
			    //.attr('name', 'searchvalue')
			    //.change(filterItemClick)
			    .appendTo($itemDiv);
				
			}

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
	