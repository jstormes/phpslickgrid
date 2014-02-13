<?php

/**
 * There is allot going on in this view helper.  
 * 
 * First, at the entry point PHPSlickgrid() all the required classes
 * are initialize.
 * 
 * Second, we route javascript (js), style sheet (css) and json requests. Triggering
 * the appropriate server for each request type and halting further flow of the 
 * view.
 * 
 * Third, if the request was not a js, css or json request, fall into the real view
 * helper logic.  
 * 
 * The jury is still out on weather this design is brilliant or perverse.  I am 
 * hoping that Zend Framework 2.X will be better.
 * 
 * @author jstormes
 *
 */
class PHPSlickgrid_View_Helper_PHPSlickgrid extends Zend_View_Helper_Abstract
{
	/**
	 * Table
	 * @var PHPSlickGrid_Db_Table
	 */
	var $Table = null;
	
	public function PHPSlickgrid(PHPSlickGrid_Db_Table $Table) {
		
		$this->Table = $Table;
		
		// Set the json entry URL, if not all ready set:
		if (!isset($Table->getGridConfiguration()->jsonrpc))
			$Table->getGridConfiguration()->jsonrpc=$this->view->url(array("action"=>"json"));
		
		// Build the HTML div for the view helper
		$HTML = "<div id='".$Table->getGridName()."' style='height:100%;'></div>\n\n";
		
		// Build the script for the view helper
		$HTML .= "<script>\n";
		
		$HTML .= "var ".$Table->getGridName()."TotalRows = ".$Table->getLength(array()).";\n\n";
		
		// Render the column configuration to the browser:
		$HTML .= "var ".$Table->getGridName()."Columns = ".$Table->getColumnConfiguration()->ToJSON().";\n\n";
				
		// Render the grid configuration to the browser:
		$HTML .= "var ".$Table->getGridName()."Options = ".$Table->getGridConfiguration()->ToJSON().";\n\n";

		// Render the grid data connection to the browser:
		$HTML .= "var ".$Table->getGridName()."Data =  new PHPSlickGrid.JSON.DataCache(".$Table->getGridName()."Options);\n\n";
		
		// Render the grid to the browser:
		$HTML .= "var ".$Table->getGridName()." = new Slick.Grid('#".$Table->getGridName()."', ".$Table->getGridName()."Data, ".$Table->getGridName()."Columns, ".$Table->getGridName()."Options);\n\n";
		
		
		// Render any needed Dynamic Java Script:
		$HTML .= $this->DynamicJS();
		
		$HTML .= "</script>\n";
		return $HTML;
	}
	
	
	private function DynamicJS() {
		
		$HTML ="";
		/********************************************************
		 * Data Events
		 ********************************************************/
		$HTML .= $this->onRowCountChanged();
		$HTML .= $this->onRowChanged();
		
		/********************************************************
		 * Grid Events
		 *******************************************************/
		$HTML .= $this->onSort();
		
		// onCellChange
		
		// onAddNewRow
		
		return $HTML;
	}
	
	private function onRowCountChanged() {
		
		$GridName = $this->Table->getGridName();
		
		$HTML  = "{$GridName}Data.onRowCountChanged.subscribe(function (e, args) { \n";
		$HTML .= "    {$GridName}.updateRowCount();\n";
		$HTML .= "    {$GridName}.render();\n";
		$HTML .= "});\n\n";
		
    	return $HTML;
	}
	
	private function onRowChanged() {
		
		$GridName = $this->Table->getGridName();
		
		$HTML  = "{$GridName}Data.onRowsChanged.subscribe(function (e, args) { \n";
    	$HTML .= "    {$GridName}.invalidateRows(args.rows);\n";
    	$HTML .= "    {$GridName}.render();\n";
		$HTML .= "});\n\n";
		
    	return $HTML;
	}
	
	private function onSort() {
		
		$GridName = $this->Table->getGridName();
		
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire up the sort to the data layer\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}.onSort.subscribe(function (e, args) {\n";
		$HTML .= "  var cols = args.sortCols;\n";
		$HTML .= "  sortarray = [];\n";
		$HTML .= "  for (var i = 0, l = cols.length; i < l; i++) {\n";
		$HTML .= "    if (cols[i].sortAsc) \n";
		$HTML .= "      sortarray.push(cols[i].sortCol.field);\n";
		$HTML .= "    else\n";
		$HTML .= "      sortarray.push(cols[i].sortCol.field+' desc');\n";
		$HTML .= "  }\n";
		$HTML .= "  {$GridName}Data.setSort(sortarray);\n";
		$HTML .= "  {$GridName}Data.invalidate();\n";
		$HTML .= "  {$GridName}.invalidate();\n";
		$HTML .= "  {$GridName}.render();\n";
		$HTML .= "});\n\n";
		
		return $HTML;
	}
	
	private function onCellChange() {
	
		$HTML = "";
	
		return $HTML;
	}
	
	private function onAddNewRow() {
	
		$HTML = "";
	
		return $HTML;
	}
}