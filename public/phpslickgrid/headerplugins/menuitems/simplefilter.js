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
		
		function setIcon() {
			if ((Object.keys(listfilter.list_selected).length!=0) || (listfilter.list_filter_contains.length!=0)) {
		    	if (self.node.find('.slick-filter-indicator').length==0) {
		    		self.node.append( "<span class='slick-filter-indicator'><i class='fa fa-filter'></i></span>" );
		    	}
		    }
		    else {
		    	//console.log("Remove");
		    	self.node.find('.slick-filter-indicator').remove();
		    }
		}
		
		function SQLTypeToDropDownOptions(SQLType) {
			var Options = '<option value="co">Choose One</option>';
			if (typeof SQLType != 'undefined') {

				switch (SQLType) {
					case 'varchar' :
						//console.log(columnDef.sql_type);
						Options += '<option value="eq">Equal To</option>';
						Options += '<option value="not">Is Not</option>';
						Options += '<option value="cn">Contains</option>';
						Options += '<option value="nc">Does not Contain</option>';
						Options += '<option value="bw">Begins With</option>';
						Options += '<option value="ew">Ends With</option>';
						FOptions=['co','eq','not','cn','bw','ew'];
						break;

					case 'bigint' :
					case 'int' :
						Options += '<option value="eq">Equal To</option>';
						Options += '<option value="not">Is Not</option>';
						Options += '<option value="lt">Less Than</option>';
						Options += '<option value="le">Less Than or Equal To</option>';
						Options += '<option value="gt">Greater Than</option>';
						Options += '<option value="ge">Greater Than or Equal To</option>';
						// Options += '<option value="be">Between</option>';
						FOptions=['co','eq','not','cn','bw','ew'];
						break;

					case 'date' :
						Options += '<option value="eq">Equal To</option>';
						Options += '<option value="not">Is Not</option>';
						Options += '<option value="lt">Less Than</option>';
						Options += '<option value="le">Less Than or Equal To</option>';
						Options += '<option value="gt">Greater Than</option>';
						Options += '<option value="ge">Greater Than or Equal To</option>';
						// Options += '<option value="be">Between</option>';
						FOptions=['co','eq','not','cn','bw','ew'];
						break;

					case 'text' :
						Options += '<option value="cn">Contains</option>';
						Options += '<option value="nc">Does not Contain</option>';
						Options += '<option value="bw">Begins With</option>';
						Options += '<option value="ew">Ends With</option>';
						FOptions=['co','cn','bw','ew'];
						break;

				}
			}
			return Options;
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
			  
			  function filterItemClick(e) {
					
					//console.log("filterItemClick");
					
					activeColumn = $(this).data('activeColumn');
					idx = $(this).data('idx');
					
					// Make sure the selected filter exists
					if (typeof activeColumn.Filters[idx] == 'undefined')
						activeColumn.Filters[idx] = {
							'operator' : 'co',
							'value' : '',
							'andor' : 'and'
						};
					
					// update the filter item in the array
					name = $(this).attr('name');
					
					switch (name) {
						case 'searchvalue' :
							if (activeColumn.Filters[idx].operator==''){
								activeColumn.Filters[idx].operator='eq';
								$(this).data('opt').selectedIndex = 2;
								
							}
							if (activeColumn.Filters[idx].operator=='co') {
								//$(this).data('opt').val('eq');
								$sel = $(this).data('opt');
								
								//var values = $.map($sel, function(elt, i) { return $(elt).val();});
								//console.log(values);
								//$sel.val(2);
								activeColumn.Filters[idx].operator=$sel[1];
								//console.log($(this).data('opt'));
								//$(this).data('opt').selectedIndex = 2;
							}
							activeColumn.Filters[idx].value = e.currentTarget.value;
							break;
						case 'operator' :
							//console.log(activeColumn.Filters[idx].value);
							activeColumn.Filters[idx].operator = e.currentTarget.value;
							if (e.currentTarget.value == 'co') {
								activeColumn.Filters.splice(idx, 1);
							}
							break;
						default :
							activeColumn.Filters[idx].andor = e.currentTarget.value;
							//if (activeColumn.Filters[idx].operator=='co')
							//	activeColumn.Filters[idx].operator='eq';
							break;
					}
					
					if (self.updateFilters.notify(e) == false) {
						return;
					}
					
					invalidate();
					
					// Stop propagation so that it doesn't register as a header
					// click
					e.preventDefault();
					e.stopPropagation();
					
				}
				
				invalidate();

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
	