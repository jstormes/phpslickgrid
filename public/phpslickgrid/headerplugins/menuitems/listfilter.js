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
		
		//self.selected = new Array();
		
		//self.mode = "NOT IN";
		
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
			
			if (self.column_def.list_filter_mode == "NOT IN") {
				if (self.column_def.list_selected[dataContext['value']])
					 return "<i class='fa fa-square-o'></i>";
				 else
					 return "<i class='fa fa-check-square'></i>";
			}
			else {
				if (self.column_def.list_selected[dataContext['value']])
					 return "<i class='fa fa-check-square'></i>";
				 else
					 return "<i class='fa fa-square-o'></i>";
			}
				
		  }
		
		function showDialog($dialog,activeColumn,$activeHeaderColumn,parent) {
			
			self.column_def = activeColumn;	// Column definition
			
			self.parentGrid =  parent.getGrid();
			
			self.rowHeight = self.parentGrid.getOptions().rowHeight;
			
			self.gridLength = 0;  // No items match your search.
			
			// Prime the column definition with our list filter properties
			if (self.column_def.list_filter_mode == undefined) {
				self.column_def.list_filter_mode = "NOT IN";
				self.column_def.list_selected = {};
				self.column_def.list_filter_contains = "";
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
			                   {id: "value", name: "<input id='listfilter_txt' type='text' style='width:"+(width-60)+"px;margin:0;padding:0;border:1px;border-style:solid;min-width:200px;' />", field: "value", width: width}
			                     ];
			
			self.GridCheck = new Slick.Grid($checkBoxDiv, self, self.GridColumns, self.CheckboxGridOptions);

			
			
			// Build (Select All) header under search header.
			self.GridCheck.onHeaderRowCellRendered.subscribe(function(e, args) {
				
				function setMode(args) {
					$(args.node).empty();
					
					if (Object.keys(self.column_def.list_selected).length!=0) {
						self.column_def.list_filter_mode="NOT IN";
						$("<i class='fa fa-check-square'></i>")
							.appendTo(args.node);
					}
					else {
					
						if (self.column_def.list_filter_mode=="NOT IN") {
							self.column_def.list_filter_mode="IN";
							$("<i class='fa fa-square-o'></i>")
								.appendTo(args.node);
						}
						else {
							self.column_def.list_filter_mode="NOT IN";
							$("<i class='fa fa-check-square'></i>")
								.appendTo(args.node);
						}
					}
					self.column_def.list_selected = new Array();
					self.GridCheck.invalidate();
					
				}
				
				$(args.node).click(function(e) { setMode(args);});
			
				// Set our default icon and string
				if (args.column.id=="selected") {
					self.$allIcon=$(args.node);
					$("<i class='fa fa-check-square'></i>").appendTo(args.node);
				}
				
				if (args.column.id=="value") {
					self.$allText=$(args.node);
					$("<div>(Select All)</div>").appendTo(args.node);
				}
				
		    });
			
			self.GridCheck.onClick.subscribe(function(e, args) {
				
				var cell = self.GridCheck.getCellFromEvent(e);
			    var value=self.getItem(cell.row).value;
			    
			    // Prepend "i" to force uniqueness
			    // otherwise a value like "length" or "size" would
			    // have a name conflict with the built in properties.
			    if (self.column_def.list_selected[value])
			    	delete self.column_def.list_selected[value];
			    else
			    	self.column_def.list_selected[value]=true;
			    
			    //self.column_def.list_selected['size']=true;
			    
			    self.$allIcon.empty();
			    //alert(Object.keys(self.selected).length);
			    if (Object.keys(self.column_def.list_selected).length!=0) {
			    	
			    	$( "<i class='fa fa-minus-square'></i>" ).appendTo(self.$allIcon);
			    	
			    }
			    else {
			    	//alert("o");
			    	$( "<i class='fa fa-check-square'></i>" ).appendTo(self.$allIcon);
			    }
			    
			    //self.selected['i'+value]=self.selected['i'+value]?false:true;
			    
				//alert("Check single "+value+" "+self.selected['i'+value]);
			    //console.log(Object.keys(self.column_def.list_selected).length);
				
			    console.log("*******************************");
			    console.log(self.column_def.list_filter_mode);
			    // Can be converted to string in PHP by $in = "'".implode("','",list_selected)."'";
			    console.log(Object.keys(self.column_def.list_selected));
			    
			    if (self.updateFilters.notify(args) == false) {
					return;
				}
			    
				self.GridCheck.updateRow(cell.row);
		        e.stopPropagation();
			});
			
			
			self.GridCheck.init();
			
			// On search entry change wait a bit then update gird and parent grid.
			$("#listfilter_txt").on('change keyup paste',function(e){
				
				var element = this;
				setTimeout(function () {
				    var text = $(element).val();
				    // do something with text
				    
				    self.$allText.empty();
					if ($("#listfilter_txt").val().length==0)
						$("<div>(Select All)</div>").appendTo(self.$allText);
					else
						$("<div>(Select All Search Results)</div>").appendTo(self.$allText);
					
					// Hide the "(Selelect All)" header row
					$(".slick-headerrow-columns").css("height","0px");
					self.GridCheck.resizeCanvas();
					
					// Show no results message
					$("<div>No items match your search.</div>")
						.css("line-height","300px")
						.css("text-align","center")
						.css("vertical-align","middle")
						//.css("position","absolute")
						.css("marginTop","-=300px")
						//.css("z-index","10000")
						.appendTo(self.$listfilter);
					
					
					
				  }, 100);
				
			});

		}
		
 		
		function hideDialog() {
			
		}
		
		
		
		
			

		
		function getLength() {
			//console.log("GetLength()");
			//return parseInt(service.getDistinctLength(self.column_def.id,self.state));
			if (self.gridLength!= 0)
				return parseInt(self.gridLength);
			
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
			
			return parseInt(self.gridLength);
			
		}
		
		function getBlock() {
			service.getBlockDistinct($start, $length, self.column_def.id, $state);
		}
		
		function getItem(item) {
			
			var blockSize=15;
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
				if (self.column_def.list_selected[self.buffer[block][offset]['value']]==true) {
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
			"getItem": getItem,
			
			"updateFilters": updateFilters
			//"getGrid": getGrid,

			//"onBeforeMenuShow" : new Slick.Event()
			//"onBeforeMenuHide" : new Slick.Event()
	
		});
	}
})(jQuery);
	