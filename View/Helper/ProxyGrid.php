<?php

/**
 *
 * @author jstormes
 *
 */
class PHPSlickgrid_View_Helper_ProxyGrid extends Zend_View_Helper_Abstract
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
	public function ProxyGrid(PHPSlickGrid_Db_Table $Table, $Proxy,$Class=null,$Style=null) {
		
		// Grab a refrence to the logger.
		$this->log              = Zend_Registry::get('log');
		// Firebug Console Log example
		//$this->log->debug("this is a debug msg");
		
		
		$this->Table = $Table;
		//$this->Options = $Options;
		
		if ($Class)
			$Class="class='{$Class}'";
		
		if ($Style)
			$Style="style='{$Style}'";
		
		$GridName = $this->Table->_gridName;
		
		// Set the json entry URL, if not all ready set:
		if (!isset($Table->_gridState['jsonrpc']))
			$Table->_gridState['jsonrpc']=$this->view->url(array("action"=>"json"));
		
		// Build the HTML div for the view helper
		$HTML = "<div id='{$GridName}' {$Class} {$Style}></div>\n\n";
		
		// Build the script for the view helper
		$HTML .= "<script>\n\n";
		
		// Render the column configuration to the browser:
		$HTML .= "// *******************************************************\n";
		$HTML .= "// Configure the columns for the grid.\n";
		$HTML .= "// *******************************************************\n";
		$HTML .= "var {$GridName}Columns = ".$Table->ColumnsToJavaScript().";\n\n";
				
		// Render the grid configuration to the browser:
		$HTML .= "// *******************************************************\n";
		$HTML .= "// Configure the initial state for the grid.\n";
		$HTML .= "// *******************************************************\n";
		$HTML .= "var {$GridName}State = ".$Table->StateToJSON().";\n\n";
		
 		// Render the grid data connection to the browser:
		$HTML .= "// *******************************************************\n";
		$HTML .= "// Instantiate the data cache.\n";
		$HTML .= "// *******************************************************\n";
 		//$HTML .= "var {$GridName}Data =  new PHPSlickGrid.JSON.DataCache({$GridName}State);\n\n";
		$HTML .= "var {$GridName}Data = {$Proxy};\n\n";
			
 		//$HTML .= $this->RestoreColumns();
		
 		// Render the grid to the browser:
 		$HTML .= "// *******************************************************\n";
 		$HTML .= "// Instantiate the grid.\n";
 		$HTML .= "// *******************************************************\n";
 		$HTML .= "var {$GridName} = new Slick.Grid('#{$GridName}', {$Proxy}, {$GridName}Columns, {$GridName}State);\n\n";
		
 		// Set sort from state
 		//$HTML .= "// *******************************************************\n";
 		//$HTML .= "// Restore any sorts.\n";
 		//$HTML .= "// *******************************************************\n";
 		//$HTML .= "{$GridName}.setSortColumns({$GridName}Data.getSort());\n\n";
			
 		// Render any needed Dynamic Java Script:
 		$HTML .= $this->DynamicJS();
		
		$HTML .= "</script>\n";
		return $HTML;
	}
	
	
	private function DynamicJS() {
		
		$HTML ="";
		/********************************************************
		 * Data Events
		 *******************************************************/
		$HTML .= $this->onRowCountChanged();
		$HTML .= $this->onRowChanged();
		
		/********************************************************
		 * Grid Events
		 *******************************************************/
		$HTML .= $this->onSort();
		$HTML .= $this->onCellChange();
		$HTML .= $this->onAddNewRow();
		//$HTML .= $this->onActiveCellChanged();
		
		//$HTML .= $this->onStateChanged();
		
		//$HTML .= $this->onActiveKeyLoaded();
		
		//$HTML .= $this->onColumnsReordered();
		//$HTML .= $this->onColumnsResized();
		
		$HTML .= $this->onInvalidate();
		
		$HTML .= $this->onFiltersChanged();
		
		/********************************************************
		 * Plugins 
		 *******************************************************/
		$HTML .= $this->renderPlugins();
		
		return $HTML;
	}
	
	private function renderPlugins() {
		
		$HTML  = "// *******************************************************\n";
		$HTML .= "// Rendering Plugins.\n";
		$HTML .= "// *******************************************************\n";

		$plugin_id = 1;
		foreach($this->Table->Plugins as $plugin) {
			$HTML .= $plugin->render($plugin_id++, $this->Table);	
		}
		
		return $HTML;
	}
	
	
	private function RestoreColumns() {
		
		$GridName = $this->Table->_gridName;
		
		$HTML  = "// *******************************************************\n";
		$HTML .= "// Restore the column size and position.\n";
		$HTML .= "// *******************************************************\n";
		$HTML .= "{$GridName}Columns={$GridName}Data.restoreColumns({$GridName}Columns);\n\n";
		
		return $HTML;
	}
	
	private function onColumnsReordered() {
		
		$GridName = $this->Table->_gridName;
		
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire grid column reorder to data cache.\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}.onColumnsReordered.subscribe(function (e, args) { \n";
		$HTML .= "    {$GridName}Data.saveColumns({$GridName}.getColumns());\n";
		$HTML .= "});\n\n";
		
		return $HTML;
	}
	
	private function onColumnsResized() {
	
		$GridName = $this->Table->_gridName;
	
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire grid column resize to data cache.\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}.onColumnsResized.subscribe(function (e, args) { \n";
		$HTML .= "    {$GridName}Data.saveColumns({$GridName}.getColumns());\n";
		$HTML .= "});\n\n";
	
		return $HTML;
	}
	
	private function onActiveCellChanged() {
		
		$GridName = $this->Table->_gridName;
		
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire active cell selected from the grid to the data cache\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}.onActiveCellChanged.subscribe(function (e, args) { \n";
		$HTML .= "    {$GridName}Data.setActive(args.row,args.cell);\n";
		$HTML .= "});\n\n";
		
		return $HTML;
		
	}
	
	private function onStateChanged() {
	
		$GridName = $this->Table->_gridName;
	
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire active cell selected from the grid to the data cache\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}Data.onStateChanged.subscribe(function (state) { \n";
		$HTML .= "  {$GridName}.scrollCellIntoView({$GridName}Data.getActiveRow(),{$GridName}Data.getActiveCell());\n";
		$HTML .= "  var ActiveRow = parseInt({$GridName}Data.getActiveRow());\n";
		$HTML .= "  var ActiveCell = parseInt({$GridName}Data.getActiveCell());\n";
		$HTML .= "  {$GridName}.setActiveCell(ActiveRow,ActiveCell);\n";
		$HTML .= "});\n\n";
	
		return $HTML;
	
	}
	
	private function onInvalidate() {
	
		$GridName = $this->Table->_gridName;
	
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire active cell selected from the grid to the data cache\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}Data.onInvalidate.subscribe(function (state) { \n";
		$HTML .= "  console.log('Invalidate***********************************');\n";
		//$HTML .= "  {$GridName}Data.invalidate();\n";
		$HTML .= "  {$GridName}.invalidate();\n";
		$HTML .= "  {$GridName}.render();\n";
		$HTML .= "});\n\n";
	
		return $HTML;
	
	}
	
	private function onActiveKeyLoaded() {
	
		$GridName = $this->Table->_gridName;
	
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire active cell loaded from the data cache to the grid\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}Data.onActiveKeyLoaded.subscribe(function (e, args) { \n";
		$HTML .= "    {$GridName}.setActiveCell(args.row,args.cell);\n";
		$HTML .= "});\n\n";
	
		return $HTML;
	
	}
	
	private function onRowCountChanged() {
		
		$GridName = $this->Table->_gridName;
		
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire up the rows count changes from the data cache to the grid\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}Data.onRowCountChanged.subscribe(function (e, args) { \n";
		$HTML .= "    {$GridName}.updateRowCount();\n";
		$HTML .= "    {$GridName}.render();\n";
		$HTML .= "});\n\n";
		
    	return $HTML;
	}
	
	private function onRowChanged() {
		
		$GridName = $this->Table->_gridName;
		
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire up the rows change from the data cache to the grid\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}Data.onRowsChanged.subscribe(function (e, args) { \n";
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
		$HTML .= "  {$GridName}Data.setSort({$GridName}.getSortColumns());\n";
		$HTML .= "  {$GridName}Data.invalidate();\n";
		$HTML .= "  {$GridName}.invalidate();\n";
		$HTML .= "  {$GridName}.render();\n";	
		
// 		$HTML .= "  {$GridName}.scrollCellIntoView({$GridName}Data.getActiveRow(),{$GridName}Data.getActiveCell());\n";
// 		$HTML .= "  var ActiveRow = parseInt({$GridName}Data.getActiveRow());\n";
// 		$HTML .= "  var ActiveCell = parseInt({$GridName}Data.getActiveCell());\n";
// 		$HTML .= "  {$GridName}.setActiveCell(ActiveRow,ActiveCell);\n";
		$HTML .= "});\n\n";
		
		return $HTML;
	}
	
	private function onFiltersChanged() {
		
		$GridName = $this->Table->_gridName;
		
		$HTML  = "// ****************************************************************\n";
		$HTML .= "// Wire up the filters to the grid\n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}Data.onFiltersChanged.subscribe(function () {\n";
		$HTML .= "	{$GridName}.invalidate();\n";
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
		$HTML .= "  {$GridName}Data.addItem(args.item); // Send new row to server\n";
		$HTML .= "});\n\n";
	
		return $HTML;
	}
}