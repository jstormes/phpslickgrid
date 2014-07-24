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
	
	
	
	function ListFilter(options) {
		
		var self= this;
		
		var default_options ={};
		
		self.state = $.extend(true, {}, default_options, options);
		
		var service = new jQuery.Zend.jsonrpc({url: options.jsonrpc, async:true, 
		    'error': function(data) {alert(data);},
		    'exceptionHandler': function(data) {alert(data);} });    // Simple error and exception handlers
		
		self.$listfilter = null;
		
		self.selected = new Array();
		
		var updateFilters = new Slick.Event();		
		
		
		function init(parent) {
			
		}
		
		function destroy(parent) {
			
		}
		
		function appliesToColumn(args) {
			return true;
		}
		
		/*********************************************************************
		 * Formatter for the checkbox. 
		 */
		function CheckboxFormatter(row, cell, value, columnDef, dataContext) {
			
			 if (self.selected['i'+dataContext['value']])
				 return "<i class='fa fa-check-square'></i>";
			 else
				 return "<i class='fa fa-square-o'></i>";
			//if (scope.options.columnDef.inFiltersMode==false) {
				// We should include only what is checked in the array 
//				if (scope.options.columnDef.inFilters['i'+dataContext['value']])
//					return "<INPUT type=checkbox value='true'  checked  class='editor-checkbox' hideFocus>";
//				else
//					return "<INPUT type=checkbox value='true' class='editor-checkbox' hideFocus>";
//			}
//			else {
//				// We should only include what is not checked in the array
//				if (scope.options.columnDef.inFilters['i'+dataContext['value']])
//					return "<INPUT type=checkbox value='true' class='editor-checkbox' hideFocus>";
//				else
//					return "<INPUT type=checkbox value='true'  checked  class='editor-checkbox' hideFocus>";	
//			}
		  }
		
		function showDialog($dialog,activeColumn,$activeHeaderColumn,_self) {
			
			self.column_def = activeColumn;	// Column definition
			
			self.parentGrid =  _self.getGrid();
			
			self.gridLength = 0;
			
			self.rowHeight = _self.getGrid().getOptions().rowHeight;
			//console.log(_self.getGrid().getOptions().rowHeight);
			
			
			
			// Make sure our column has a list filter definition. 
			if (typeof activeColumn.ListFilter == 'undefined') {
				activeColumn.ListFilter = new Object();
				activeColumn.ListFilterIncusive = false;
			}
			
			self.buffer = new Array();		// Buffer for data cache
			self.quicksearch = '';	// Quick search string
			
			self.$listfilter = $("<div></div>");
			self.$listfilter.appendTo($dialog);
			
			//$("<div style='text-align:center;'><b>Checkbox Filters...</b></div>").appendTo(self.$listfilter);
			
			// Load Checkbox Slickgrid
			$checkBoxDiv = $("<div id='listfilter' style='border:1px;border-style:solid;border-color:gray;'></div>")
				.css("height","300px")
				.css("min-width","250px")
				.css("width",parseInt(self.column_def.width)+"px")
				.appendTo(self.$listfilter);
				
			self.CheckboxGridOptions = {
					showHeaderRow: true,
					headerRowHeight: 22,
					explicitInitialization: true,
					editable: true,
					enableCellNavigation: true,
					autoEdit: true,
					forceFitColumns: true,
					autoHeight: false,
					rowHeight: self.rowHeight
				};

			var width = self.column_def.width;
			
			
			self.GridColumns = [  
			                   {id: "selected", name: "<i class='fa fa-search'></i>", field: "selected", width: 25, minWidth:25, maxWidth:25, formatter: CheckboxFormatter, cssClass:'no-scroll'},
			                   {id: "value", name: "<input id='jesfgrgl' type='text' style='width:"+(width-60)+"px;margin:0;padding:0;border:1px;border-style:solid;min-width:200px;' />", field: "value", width: width}
			                     ];
			
			self.GridCheck = new Slick.Grid($checkBoxDiv, self, self.GridColumns, self.CheckboxGridOptions);

			// Build (Select All) header under search header.
			self.GridCheck.onHeaderRowCellRendered.subscribe(function(e, args) {
				
				$(args.node).empty();
				$(args.node).click(function(e) {alert("select all");});
				if (args.column.id=="selected") {
					self.$allIcon=$("<i class='fa fa-check-square'></i>")
					.appendTo(args.node);
					
				}
				
				if (args.column.id=="value") {
					self.$allText=$("<div>(Select All)</div>")
					.appendTo(args.node);
				}
				
		    });
			
			self.GridCheck.onClick.subscribe(function(e, args) {
				
				var cell = self.GridCheck.getCellFromEvent(e);
			    var value=self.getItem(cell.row).value;
			    
			    if (self.selected['i'+value])
			    	delete self.selected['i'+value];
			    else
			    	self.selected['i'+value]=true;
			    
			    self.$allIcon.empty();
			    //alert(Object.keys(self.selected).length);
			    if (Object.keys(self.selected).length!=0) {
			    	$(self.$allIcon).replaceWith( "<i class='fa fa-minus-square'></i>" );
			    }
			    else {
			    	//alert("o");
			    	$(self.$allIcon).replaceWith( "<i class='fa fa-check-square'></i>" );
			    }
			    
			    //self.selected['i'+value]=self.selected['i'+value]?false:true;
			    
				//alert("Check single "+value+" "+self.selected['i'+value]);
			    console.log(Object.keys(self.selected).length);
				
				self.GridCheck.updateRow(cell.row);
		        e.stopPropagation();
			});
			
			
			self.GridCheck.init();

		}
		
 		
		function hideDialog() {
			
		}
		
		
		
		
			

		
		function getLength() {
			//console.log("GetLength()");
			//return parseInt(service.getDistinctLength(self.column_def.id,self.state));
			if (self.gridLength!= 0)
				return parseInt(self.gridLength)+1;
			
			service.getDistinctLength(self.column_def.id,self.state,
					{'success' : 
						function(length){
							if (length != self.gridLength) {
								self.gridLength = parseInt(length); 
								self.GridCheck.updateRowCount();
								self.GridCheck.render();
							}
						} 
					});
			
			return parseInt(self.gridLength)+2;
			
		}
		
		function getBlock() {
			service.getBlockDistinct($start, $length, self.column_def.id, $state);
		}
		
		function getItem(item) {
			
			//if (item == 0) {
			//	return {'selected':true,'value':'(Select All)'};
			//}
			
			var blockSize=20;
			var block = Math.floor(item/blockSize);  
			var offset = item%blockSize;
			var blockStart = block*blockSize;
			
			
			
			if (self.buffer[block]==undefined) {
				self.buffer[block] = new Array();
			
				service.getBlockDistinct(blockStart, blockSize, self.column_def.id, self.state,
					{
					'success' : 
						function(data){
							self.buffer[block]=data;
							var len = data.length;
							var indices = new Array();
							for ( var i = 0; i < len; i++) {
								indices[i]=blockStart+i;
							}
							self.GridCheck.invalidateRows(indices);
							self.GridCheck.render();
						} 
					});
			}
			
			
			if (self.buffer[block][offset] != undefined) {
				self.buffer[block][offset]['selected']=false;
				if (self.selected[self.buffer[block][offset]['value']]==true) {
					self.buffer[block][offset]['selected']=true;
				}
			}
			
			
			
			return self.buffer[block][offset];
		}
		
		
		$.extend(this, {
			"init" : init,
			"showDialog" : showDialog,
			"destroy" : destroy,
			"hideDialog" :hideDialog,
			"appliesToColumn" : appliesToColumn,
			"getLength": getLength,
			"getItem": getItem
			//"getGrid": getGrid,

			//"onBeforeMenuShow" : new Slick.Event()
			//"onBeforeMenuHide" : new Slick.Event()
	
		});
	}
})(jQuery);
	