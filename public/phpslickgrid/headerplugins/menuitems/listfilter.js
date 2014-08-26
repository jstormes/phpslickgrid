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
	
	
	
	function ListFilter(options, grid, data) {
		
		var self= this;
		
		var listfilter = null;
		
		var default_options ={};
		
		var node = null;
		
		self.state = $.extend(true, {}, default_options, options);
		
		var service = new jQuery.Zend.jsonrpc({url: options.jsonrpc, async:true, 
		    'error': function(data) {alert(data);},
		    'exceptionHandler': function(data) {alert(data);} });    // Simple error and exception handlers
		//var service = data;
		//console.log(service);
		
		self.$listfilter = null;
		
		//self.selected = new Array();
		
		//self.mode = "NOT IN";
		
		//var updateFilters = new Slick.Event();		
		
		
		function init(parent) {


		}
		
		function destroy(parent) {
			
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
		
		function appliesToColumn(args) {
			
			//console.log("header row render");
			//console.log(args.column);
			//console.log(data.getColumnFilters());
			//var node = args.node.innerHTML.span;
			//var ColumnName = $(args.node);
			//$(args.node).append( "<span class='slick-filter-indicator'><i class='fa fa-filter'></i></span>" );
			//console.log(ColumnName.html());
			//var $ColumnHTML = $(node.innerHTML);
			//$columnName = $ColumnHTML.closest('slick-column-name');
			//$columnName.prepend("test");
			//console.log($columnName);
			return true;
		}
		
		/*********************************************************************
		 * Formatter for the checkbox. 
		 */
		function CheckboxFormatter(row, cell, value, columnDef, dataContext) {
			
			if (listfilter.list_filter_mode == "NOT IN") {
				if (listfilter.list_selected[dataContext['value']])
					 return "<i class='fa fa-square-o'></i>";
				 else
					 return "<i class='fa fa-check-square'></i>";
			}
			else {
				if (listfilter.list_selected[dataContext['value']])
					 return "<i class='fa fa-check-square'></i>";
				 else
					 return "<i class='fa fa-square-o'></i>";
			}
				
		  }
		
		function showDialog($dialog,activeColumn,$activeHeaderColumn,parent) {
			
			console.log("Show Dialog");
			console.log($activeHeaderColumn.html());
			
			self.node=$activeHeaderColumn;
			self.column_def = activeColumn;	// Column definition
			
			//self.parentGrid =  parent.getGrid();
			
			//self.gridData = self.parentGrid.getData();
			
			//self.gridState = self.gridData.self.state;
			
			//self.filters = self.gridData.self.state.localStorage.filters = [];
			
			//console.log(self.gridData.self.state.localStorage);
			
			// match the row height from the source grid.
			self.rowHeight = grid.rowHeight;
			
			self.gridLength = 0;  // default to, No items match your search.
			
			//console.log(self.column_def.id);
			//data.self.state.filters={'test':'tests'};
			
			if (data.self.state.filters[self.column_def.field] == undefined) {
				
				//console.log("Defining column");
				listfilter = {};
				listfilter.list_filter_mode = "NOT IN";
				listfilter.list_selected = {};
				listfilter.list_filter_contains = "";
				
				data.self.state.filters[self.column_def.field]=listfilter;
				
				
				//data.self.state.filters[self.column_def.id]={};
				//data.self.state.filters[self.column_def.id].list_filter_mode = "NOT IN";
				//data.self.state.filters[self.column_def.id].list_selected = {};
				//data.self.state.filters[self.column_def.id].list_filter_contains = "";
			}
			else {
				listfilter = data.self.state.filters[self.column_def.field];
			}
			
			//var listfilter = data.self.state.filters[self.column_def.id];
			//console.log(listfilter);
			
			// Prime the column definition with our list filter properties
			//if (self.column_def.list_filter_mode == undefined) {
			//	self.column_def.list_filter_mode = "NOT IN";
			//	self.column_def.list_selected = {};
			//	self.column_def.list_filter_contains = "";
			//}
			
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
			
			// Define our columns
			self.GridColumns = [  
			                   {id: "selected", name: "<i class='fa fa-search'></i>", field: "selected", width: 25, minWidth:25, maxWidth:25, formatter: CheckboxFormatter, cssClass:'no-scroll'},
			                   {id: "value", name: "<input id='listfilter_txt' type='text' value='"+listfilter.list_filter_contains+"' style='width:"+(width-60)+"px;margin:0;padding:0;border:1px;border-style:solid;min-width:200px;' />", field: "value", width: width}
			                     ];
			
			self.GridCheck = new Slick.Grid($checkBoxDiv, self, self.GridColumns, self.CheckboxGridOptions);

			
			
			// Build (Select All) header under search header.
			self.GridCheck.onHeaderRowCellRendered.subscribe(function(e, args) {
				

				
				// Set our default icon and string
				if (args.column.id=="selected") {
					self.$allIcon=$(args.node);
					$("<i class='fa fa-check-square'></i>").appendTo(args.node);
				}
				
				// set our default notification string
				if (args.column.id=="value") {
					self.$allText=$(args.node);
					$("<div>(Select All)</div>").appendTo(args.node);
				}
				
				// function to set the mode.
				function setMode(args) {
					// Empty icon cell
					self.$allIcon.empty();
					
					if (Object.keys(listfilter.list_selected).length!=0) {
						listfilter.list_filter_mode="NOT IN";
						$("<i class='fa fa-check-square'></i>")
							.appendTo(self.$allIcon);
					}
					else {
					
						if (listfilter.list_filter_mode=="NOT IN") {
							listfilter.list_filter_mode="IN";
							$("<i class='fa fa-square-o'></i>")
								.appendTo(self.$allIcon);
						}
						else {
							listfilter.list_filter_mode="NOT IN";
							$("<i class='fa fa-check-square'></i>")
								.appendTo(self.$allIcon);
						}
					}
					listfilter.list_selected = {};
					self.GridCheck.invalidate();
					
				}
				
				// on click of the header row set the mode
				$(args.node).click(function(e) { 
					setMode(args);
					//data.self.state.filters[self.column_def.field]=listfilter;
					setIcon();
					data.setColumnFilters(self.column_def.field,listfilter);
					
					//if (self.updateFilters.notify(args) == false) {
					//	return;
					//}
				});
				
				
				
		    });
			
			self.GridCheck.onClick.subscribe(function(e, args) {
				
				
				
				var cell = self.GridCheck.getCellFromEvent(e);
			    var value=self.getItem(cell.row).value;
			    
			    // Prepend "i" to force uniqueness
			    // otherwise a value like "length" or "size" would
			    // have a name conflict with the built in properties.
			    if (listfilter.list_selected[value])
			    	delete listfilter.list_selected[value];
			    else
			    	listfilter.list_selected[value]=true;
			    
			    //self.column_def.list_selected['size']=true;
			    
			    self.$allIcon.empty();
			    //alert(Object.keys(self.selected).length);
			    if (Object.keys(listfilter.list_selected).length!=0) {
			    	
			    	$( "<i class='fa fa-minus-square'></i>" ).appendTo(self.$allIcon);
			    	
			    }
			    else {
			    	//alert("o");
			    	$( "<i class='fa fa-check-square'></i>" ).appendTo(self.$allIcon);
			    }
			    
			    
			    
			    //self.selected['i'+value]=self.selected['i'+value]?false:true;
			    
				//alert("Check single "+value+" "+self.selected['i'+value]);
			    //console.log(Object.keys(self.column_def.list_selected).length);
				
			   // data.self.state.filters[self.column_def.field]=listfilter;
			    
			    //console.log("*******************************");
			    //console.log(data.self.state.filters[self.column_def.field].list_filter_mode);
			    // Can be converted to string in PHP by $in = "'".implode("','",list_selected)."'";
			   // console.log(Object.keys(data.self.state.filters[self.column_def.field].list_selected));
			    
			    console.log(listfilter);
			    console.log("Icon");
			    //console.log(self.node);
			    console.log(self.node.find('.slick-filter-indicator').length);
			    //if ((Object.keys(listfilter.list_selected).length!=0) || (listfilter.list_filter_contains.length!=0)) {
			    //	if (self.node.find('.slick-filter-indicator').length==0) {
			    //		self.node.append( "<span class='slick-filter-indicator'><i class='fa fa-filter'></i></span>" );
			    //	}
			    //}
			    //else {
			    	//console.log("Remove");
			    //	self.node.find('.slick-filter-indicator').remove();
			    //}
			    setIcon();
			    
			    
			    data.setColumnFilters(self.column_def.field,listfilter);
			   // if (self.updateFilters.notify(args) == false) {
				//	return;
				//}
			    
			    //self.parentGrid.invalidate();
			    
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
					
					listfilter.list_filter_contains = text;
					
					//data.self.state.filters[self.column_def.field]=listfilter;
					
					
					self.gridLength=0;
					self.buffer = [];
					self.GridCheck.invalidate();
					
					
					// TODO: this needs to be event driven.
					// attached to the on length changed event
					// Comment out for now
//					if (self.gridLength == 0) {
//						// Hide the "(Selelect All)" header row
//						$(".slick-headerrow-columns").css("height","0px");
//						self.GridCheck.resizeCanvas();
//						
//						// Show no results message
//						$("<div>No items match your search.</div>")
//							.css("line-height","300px")
//							.css("text-align","center")
//							.css("vertical-align","middle")
//							//.css("position","absolute")
//							.css("marginTop","-=300px")
//							//.css("z-index","10000")
//							.appendTo(self.$listfilter);
//					} 
//					else {
//						console.log("Resetting height!!!!!!!!!!!!!!!!!!");
//						$(".slick-headerrow-columns").css("height","22px");
//						self.GridCheck.resizeCanvas();
//					}
					
					setIcon();
					data.setColumnFilters(self.column_def.field,listfilter);
					//if (self.updateFilters.notify() == false) {
					//	return;
					//}
					
					
				  }, 200);
				e.stopPropagation();
			});

		}
		
 		
		function hideDialog() {
			
		}
		
		
		
		
			

		
		function getLength() {
			//console.log("GetLength()");
			//return parseInt(service.getDistinctLength(self.column_def.id,self.state));
			if (self.gridLength!= 0)
				return parseInt(self.gridLength)+1;
			
			service.getDistinctLength(self.column_def.field,data.self.state,
					{'success' : 
						function(length){
							if (length != self.gridLength) {
								self.gridLength = parseInt(length); 
								self.GridCheck.updateRowCount();
								self.GridCheck.render();
							}
						} 
					});
			
			return parseInt(self.gridLength)+1;
			
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
			
				service.getBlockDistinct(blockStart, blockSize, self.column_def.field, data.self.state,
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
				if (listfilter.list_selected[self.buffer[block][offset]['value']]==true) {
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
			
		//	"updateFilters": updateFilters
			//"getGrid": getGrid,

			//"onBeforeMenuShow" : new Slick.Event()
			//"onBeforeMenuHide" : new Slick.Event()
	
		});
	}
})(jQuery);
	