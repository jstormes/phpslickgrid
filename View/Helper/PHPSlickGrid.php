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
		
		// Get a handle on the front controller.
		$this->_frontController = Zend_Controller_Front::getInstance();
		
		// Get all the phpslickgrid support js files to include.
		$js=new PHPSlickGrid_Minify_js();
		
		// Get all the phpslickgrid support js files to include.
		$css=new PHPSlickGrid_Minify_css();
		
		
		
		//******************************************************************
		// Macro actions:
		// if request is for a js file serve the js file.
// 		if ($this->_frontController->getRequest()->getParam('js','false')!='false') {
// 			$this->view->layout()->disableLayout(true);
// 			$this->_frontController->getResponse()->clearBody();
// 			$this->_frontController->setParam('noViewRenderer', true);
 			//Zend_Controller_Front::getInstance()->getResponse()->clearBody();
// 			Zend_Controller_Front::getInstance()
// 			->setParam('noViewRenderer', true);
// 			$js->serve_file($_GET['js']);
// 			exit(); // stop the view from being displayed
// 			break;
// 		}
// 		// if request is for a css file serve the css file.
// 		if ($this->_frontController->getRequest()->getParam('css','false')!='false') {
// 			$this->view->layout()->disableLayout(true);
// 			//$this->_helper->viewRenderer->setNoRender(true);
// 			$css->serve_file($_GET['css']);
				
// 			exit(); // stop the view from being displayed
// 			break;
// 		}
// 		// if the request is for json api then server json api.
// 		if ($this->_frontController->getRequest()->getParam('json','false')!='false') {
// 			$this->view->layout()->disableLayout(true);
// 			//$this->_helper->viewRenderer->setNoRender(true);
			
// 			// Create a new instance of a JSON webservice service using our source table and grid configuration.
//  			$server = new PHPSlickGrid_JSON($Table);
//  			// Expose the JSON database table service trough this action.
//  			$server->handle();
				
// 			exit(); // stop the view from being displayed
// 			break;
// 		}
		//******************************************************************
		
		// if we make is here then we are generating HTML for the view helper.
		
		// Add js and css to view.
		$js->add_files_to_view($this->view);
		$css->add_files_to_view($this->view);
		
		// Set the json entry URL:
		$Table->getGridConfiguration()->jsonrpc=$this->view->url(array("action"=>"service","json"=>"true"));
		
		// Build the HTML for the view helper
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
		
		
		// Render grid onEvent logic:
		$HTML .= $this->onEvents();
		
		$HTML .= "</script>\n";
		return $HTML;
	}
	
	
	private function onEvents() {
		
		$HTML ="";
		/********************************************************
		 * Data Events
		 ********************************************************/
		// onRowCountChanged
		$HTML .= $this->onRowCountChanged();
		
		// onRowChanged
		$HTML .= $this->onRowChanged();
		
		/********************************************************
		 * Grid Events
		 *******************************************************/
		// onSort
		
		// onCellChange
		
		// onAddNewRow
		
		return $HTML;
	}
	
	private function onRowCountChanged() {
		
		$HTML = @"
{$this->Table->getGridName()}Data.onRowCountChanged.subscribe(function (e, args) {
    {$this->Table->getGridName()}.updateRowCount();
    {$this->Table->getGridName()}.render();
});\n\n";
    	return $HTML;
	}
	
	private function onRowChanged() {
		$HTML = @"
{$this->Table->getGridName()}Data.onRowsChanged.subscribe(function (e, args) {
    {$this->Table->getGridName()}.invalidateRows(args.rows);
    {$this->Table->getGridName()}.render();
});\n\n";
    	return $HTML;
	}
	
	private function onSort() {
		
		$HTML = "";
		
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