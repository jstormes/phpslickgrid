<?php
/**
 *
 * @author jstormes
 * @version 
 */

/**
 * HeaderMenu helper
 *
 * @uses viewHelper {0}
 */
class PHPSlickgrid_View_Helper_HeaderMenu extends Zend_View_Helper_Abstract
{

	/**
	 * @var Zend_View_Interface 
	 */
	public $view;

	/**
	 *  
	 */
	public function HeaderMenu($name, PHPSlickGrid_Db_Table $Table, $options=array()) {
		
		$GridName = $Table->_gridName;
		$options = json_encode($options);
		
		$HTML = "<!-- hello -->\n";
		$HTML .= "<script>\n\n";
		$HTML .= "  if ({$GridName}_menus == 'undefined') var {$GridName}_menus=1;\n";
		$HTML .= "    else {$GridName}_menus++;\n";
		$HTML .= "	var {$name}_menu = new PHPSlickGrid.HeaderMenu({$GridName}, {$GridName}Data, {$options});\n\n";
		$HTML .= "</script>\n\n";
		return $HTML;
	}

	/**
	 * Sets the view field 
	 * @param $view Zend_View_Interface
	 */
	public function setView(Zend_View_Interface $view) {
		$this->view = $view;
	}
}
