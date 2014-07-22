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
		
		var service = new jQuery.Zend.jsonrpc({url: options.jsonrpc, async:false, 
		    'error': function(data) {alert(data);},
		    'exceptionHandler': function(data) {alert(data);} });    // Simple error and exception handlers
		
		self.$listfilter = null;
		
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
			//if (scope.options.columnDef.inFiltersMode==false) {
				// We should include only what is checked in the array 
//				if (scope.options.columnDef.inFilters['i'+dataContext['value']])
					return "<INPUT type=checkbox value='true'  checked  class='editor-checkbox' hideFocus>";
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
			
			console.log(self.column_def.width);
			
			
			
			// Make sure our column has a list filter definition. 
			if (typeof activeColumn.ListFilter == 'undefined') {
				activeColumn.ListFilter = new Object();
				activeColumn.ListFilterIncusive = false;
			}
			
			self.buffer = new Array();		// Buffer for data cache
			self.quicksearch = '';	// Quick search string
			
			self.$listfilter = $("<div></div>");
			self.$listfilter.appendTo($dialog);
			
			$("<div style='text-align:center;'><b>Checkbox Filters...</b></div>").appendTo(self.$listfilter);
			
			// Load Checkbox Slickgrid
			$checkBoxDiv = $("<div id='listfilter' style='border:1px;border-style:solid;border-color:gray;'></div>")
				.css("height","300px")
				.css("min-width","250px")
				.css("width",parseInt(self.column_def.width)+"px")
				.appendTo(self.$listfilter);
				
			self.CheckboxGridOptions = {
					editable: true,
					enableCellNavigation: true,
					autoEdit: true,
					forceFitColumns: true,
					autoHeight: false
				};

			var width = self.column_def.width;
			
			
			self.GridColumns = [  
			                   {id: "selected", name: "<input id='jesfgrgk' class='editor-checkbox' type='checkbox'>", field: "selected", width: 25, minWidth:25, maxWidth:25, formatter: CheckboxFormatter, cssClass:'no-scroll'},
			                   {id: "value", name: "<input id='jesfgrgl' type='text' style='width:"+(width-60)+"px;margin:0;padding:0;border:1px;border-style:solid;min-width:200px;' />", field: "value", width: width}
			                     ];
			
			self.GridCheck = new Slick.Grid($checkBoxDiv, self, self.GridColumns, self.CheckboxGridOptions);

			width=$checkBoxDiv.width();
			console.log("Width");
			console.log(width);
			//$dialog.css("width",(width)+"px");
			
			
			
			
			
			
			//self.column_nm = activeColumn.id;
			//console.log(self.column_def.id);
			//var len = getLength();
			//$item_div=$("<div>ListFilter "+len+"</div>").appendTo(self.$listfilter);
		}
		
 		
		function hideDialog() {
			
		}
		
		
			

		
		function getLength() {
			//console.log("GetLength()");
			return parseInt(service.getDistinctLength(self.column_def.id,self.state));
		}
		
		function getBlock() {
			service.getBlockDistinct($start, $length, self.column_def.id, $state);
		}
		
		function getItem(item) {
			var blocksize=100;
			var block = item%blocksize;
			var blockstart = block*blocksize;
			var offset = item/blocksize;
			
			self.buffer[item]=service.getBlockDistinct(item, 1, self.column_def.id, self.state);
			
			console.log(self.buffer[item][0]);
			console.log({'value':"tset"});
			//console.log("getItem()");
			//console.log(item);
			return self.buffer[item][0];
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
	