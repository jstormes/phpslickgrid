<?php

/**
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
	
	/**
	 * Options for the view
	 * 
	 * @var array
	 */
	var $Options = null;
	
	/**
	 * 
	 *
	 * By: jstormes Feb 20, 2014
	 *
	 * @param PHPSlickGrid_Db_Table $Table
	 * @param array $Options
	 * @return string
	 */
	public function PHPSlickgrid(PHPSlickGrid_Db_Table $Table,array $Options=array()) {
		
		$this->Table = $Table;
		$this->Options = $Options;
		
		$GridName = $this->Table->_gridName;
		
		// Set the json entry URL, if not all ready set:
		if (!isset($Table->_gridState['jsonrpc']))
			$Table->_gridState['jsonrpc']=$this->view->url(array("action"=>"json"));
		
		// Build the HTML div for the view helper
		$HTML = "<div id='{$GridName}' style='height:100%;'></div>\n\n";
		
		// Build the script for the view helper
		$HTML .= "<script>\n";
		
		//$HTML .= "var {$GridName}TotalRows = ".$Table->getLength(array()).";\n\n";
		
		// Render the column configuration to the browser:
		//$HTML .= "var {$GridName}Columns = ".$Table->ColumnsToJSON().";\n\n";
		$HTML .= "var {$GridName}Columns = ".$Table->ColumnsToJavaScript().";\n\n";
				
		// Render the grid configuration to the browser:
		$HTML .= "var {$GridName}State = ".$Table->StateToJSON().";\n\n";

// 		// Render the grid data connection to the browser:
// 		if (isset($Options['DataFromGrid']))
// 			$HTML .= "var {$GridName}Data =  new PHPSlickGrid.JSON.DataMirror('{$Options['DataFromGrid']}Data');\n\n";
// 		else
 			$HTML .= "var {$GridName}Data =  new PHPSlickGrid.JSON.DataCache({$GridName}State);\n\n";
		
// 		// Render the grid to the browser:
 		$HTML .= "var {$GridName} = new Slick.Grid('#{$GridName}', {$GridName}Data, {$GridName}Columns, {$GridName}State);\n\n";
		
		
// 		// Render any needed Dynamic Java Script:
 		$HTML .= $this->DynamicJS();
		
		
// 		//$HTML .= "    {$GridName}.render();\n";
		
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
		$HTML .= $this->onCellChange();
		$HTML .= $this->onAddNewRow();
		
		return $HTML;
	}
	
	private function onRowCountChanged() {
		
		$GridName = $this->Table->_gridName;
		
		$HTML  = "{$GridName}Data.onRowCountChanged.subscribe(function (e, args) { \n";
		$HTML .= "    {$GridName}.updateRowCount();\n";
		$HTML .= "    {$GridName}.render();\n";
		$HTML .= "});\n\n";
		
    	return $HTML;
	}
	
	private function onRowChanged() {
		
		$GridName = $this->Table->_gridName;
		
		$HTML  = "{$GridName}Data.onRowsChanged.subscribe(function (e, args) { \n";
		//$HTML .= "    console.log('updating rows '+args.rows);\n";
    	$HTML .= "    {$GridName}.invalidateRows(args.rows);\n";
    	$HTML .= "    {$GridName}.render();\n";
		$HTML .= "});\n\n";
		
    	return $HTML;
	}
	
	private function onSort() {
		
		$GridName = $this->Table->_gridName;
		
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire up the sort to the data layer\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}.onSort.subscribe(function (e, args) {\n";
		$HTML .= "  var cols = args.sortCols;\n";
		$HTML .= "  var sortarray = [];\n";
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
		
		$GridName = $this->Table->_gridName;
	
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire up row update \n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}.onCellChange.subscribe(function(e, args) {\n";
		$HTML .= "  {$GridName}Data.updateItem(args.item); // Send updated row to server\n";
		$HTML .= "});\n\n";
	
		return $HTML;
	}
	
	private function onAddNewRow() {
		
		$GridName = $this->Table->_gridName;
	
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire up row add \n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}.onAddNewRow.subscribe(function(e, args) {\n";
		$HTML .= "";
//		$HTML .= "  console.log({$GridName}Data.getLength());\n";
//		$HTML .= "  console.log(args);\n";
		$HTML .= "  {$GridName}Data.addItem(args.item); // Send new row to server\n";
//		$HTML .= "  {$GridName}Data.invalidate({$GridName}Data.getLength()+2);\n";
//		$HTML .= "  console.log({$GridName}Data.getLength());\n";
		
//		$HTML .= "  {$GridName}Data.getItem({$GridName}Data.getLength()+3);\n";
//		$HTML .= "  {$GridName}.invalidateRow({$GridName}Data.getLength()-1);\n";
//		$HTML .= "  {$GridName}.render();\n";
		$HTML .= "});\n\n";
	
		return $HTML;
	}
}