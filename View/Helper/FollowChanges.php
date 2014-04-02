<?php
/*
David Davidson: This is in chronicle views>index.phtml
                     $(element).addClass('updated', 100, function() {
                        $(element).removeClass('updated', 300);
                    });
 Where $(element) is the cell with the value that was just changed.
 Add the class over 100 ms and then remove it over 300ms
 */

class PHPSlickgrid_View_Helper_FollowChanges extends Zend_View_Helper_Abstract
{
	/*
	 * https://github.com/mleibman/SlickGrid/wiki/Slick.Grid#setCellCssStyles
	 */
	
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
	
	public function FollowChanges(PHPSlickGrid_Db_Table $Table,array $Options=array()) {
		
		$this->Table = $Table;
		$this->Options = $Options;
		
		$GridName = $this->Table->getGridName();
		
		$HTML = '';
		
		// Build the script for the view helper
		$HTML .= "\n\n<script>\n";
		//$HTML .= "console.log({$GridName});\n\n";
		$HTML .= '    var changes = {1:{grid$A:"load-medium"}};';
		//$HTML .= "console.log(changes);\n\n";
		$HTML .= "    {$GridName}.setCellCssStyles('highlight', changes);\n";
		$HTML .= "    {$GridName}.render();\n";
		
		$HTML .= "// ****************************************************************\n";
		$HTML .= "// Wire up hightlight changes \n";
		$HTML .= "// ****************************************************************\n";
		$HTML .= "{$GridName}Data.onPollReply.subscribe(function(e, args) {\n";
		
		$HTML .= "  if (typeof(args['updatedCells'])!='undefined'){ \n";
		//$HTML .= "    console.log('hightlight changes');\n";
		//$HTML .= "	  console.log(args);\n";
		
				
		
		
		
		$HTML .= "}\n";
		//$HTML .= "  {$GridName}Data.updateItem(args.item); // Send updated row to server\n";
		$HTML .= "});\n\n";
		
		$HTML .= "</script>\n";
		return $HTML;
	}
	
}