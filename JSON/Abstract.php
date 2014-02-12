<?php
abstract class PHPSlickGrid_JSON_Abstract
{
	/** @var Zend_Db_Table_Abstract */
	public $Table = null;
	
	
	public $Config = null;
	public $TableName = null;
	public $PrimaryKey = null;
	public $UpdatedColumn = null;
	public $parameters = null;
	
	public $log = null;
	
	function __construct() {

		
		// Get our logger for debugging
		$this->log = Zend_Registry::get('log');
	
		/******************************************************
		 * NOTES: 
		 * 
		 * Due to the way the request/refresh cycle works with
		 * HTTP/JSON we need to store our parameters into the 
		 * registry, then retrieve them here.
		 ******************************************************/
		
		// Get Parameters passed to PHPSlickGrid_JSON_DbTable
		$this->parameters=Zend_Registry::get('PHPSlickGrid_JSON');
		$TableClassName=$this->parameters['table'];
		$this->Table=new $TableClassName();
	
		// Get our table configuration
		$this->Config = $this->parameters['config'];
	
		// Get some info about our table
		$this->TableName=$this->Table->info('name');
		$this->info=$this->Table->info();
		$this->PrimaryKey=array_shift($this->info['primary']);
	
		// Set "Default" row updated date time column
		$info = $this->Table->info('metadata');
		foreach($info as $key=>$value) {
			if (($value['DEFAULT']=='CURRENT_TIMESTAMP')&&($value['DATA_TYPE']=='timestamp')) {
				$this->UpdatedColumn=$key;
				break;
			}
		}
		
		// if a update date time column is set override the default.
		if (isset($this->Config->upd_dtm_col))
			$this->UpdatedColumn=$this->Config->upd_dtm_col;
	}
	
	/***********************************************************************
	 * Common logic across all DbTable JSON calls.  
	 ***********************************************************************/
	
	/**********************************************************************
	 *
	 * Conditions are filters set in the controller logic that hidden
	 * from the user.  "Project_id" and "record_id" are examples of 
	 * filters that might be set in conditions.
	 * 
	 * Conditions MUST be applied to every select!!!!!!
	 *********************************************************************/
	public function addConditionsToSelect($table_name ,$conditions, $select) {
	
		foreach($conditions as $condition) {	
			if ($condition->type=='and')
				$select->where($table_name.".".$condition->column.$condition->operator." ? ",$condition->value);
			else
				$select->orWhere($table_name.".".$condition->column.$condition->operator." ? ",$condition->value);
		}
		
	}
	
	/***********************************************************************
	 * Where filters are filters set by the user. 
	 ***********************************************************************/
	public function createWhere($table_name, $sel, $where_list) {
	
		if (count($where_list)>0) {
			foreach($where_list as $where) {
				$columnName=$table_name.".".$where['column'];
				$operator=$where['operator'];
				$searchvalue=$where['searchvalue'];
				$andor=$where['andor'];
	
				if ($where['andor']=='and')
					$UseWhere='where';
				else
					$UseWhere='where';
				//$UseWhere='orWhere';
	
				switch($operator) {
					case 'eq':
						if ($searchvalue=='')
							$sel->Where("(`$columnName` is null or `$columnName` = ?)",$searchvalue);
						else
							$sel->$UseWhere("`$columnName` = ?",$searchvalue);
						break;
					case 'not':
						$sel->$UseWhere("`$columnName` != ?",$searchvalue);
						break;
					case 'cn': // Contains
						$sel->$UseWhere("`$columnName` like ?","%{$searchvalue}%");
						break;
					case 'nc': // Contains
						$sel->$UseWhere("`$columnName` not like ?","%{$searchvalue}%");
						break;
					case 'bw': // Begins with
						$sel->$UseWhere("`$columnName` like ?","{$searchvalue}%");
						break;
					case 'ew': // Ends with
						$sel->$UseWhere("`$columnName` like ?","%{$searchvalue}");
						break;
					case 'lt': // Less than
						$sel->$UseWhere("`$columnName` < ?",$searchvalue);
						break;
					case 'le': // Less than or equal to
						$sel->$UseWhere("`$columnName` <= ?",$searchvalue);
						break;
					case 'gt': // Greater than
						$sel->$UseWhere("`$columnName` > ?",$searchvalue);
						break;
					case 'ge': // Greater than or equal to
						$sel->$UseWhere("`$columnName` >= ?",$searchvalue);
						break;
					case 'be': // between
						$sel->$UseWhere("`$columnName` between ?",$searchvalue);
						break;
					 case 'in': // in
                        // $newval = explode(',',$searchvalue);
                        $newval = explode('||',$searchvalue);
                        if (in_array('null',$newval))
                            $sel->$UseWhere("($columnName is null or $columnName in (?))",$newval);
                        else
                            $sel->$UseWhere("$columnName in (?)",$newval);
                        break;
						
					case 'ni': // ni
                        // $newval = explode(',',$searchvalue);
                        $newval = explode('||',$searchvalue);
                        if (in_array('null',$newval))
                            $sel->$UseWhere("($columnName is not null and $columnName not in (?))",$newval);
                        else
                            $sel->$UseWhere("$columnName not in (?)",$newval);
                        break;
							
					case 'qu': // Contains
						$sel->$UseWhere("`$columnName` like ?","%{$searchvalue}%");
						break;
					default:  // Assume equals
						if ($searchvalue=='')
							$sel->Where("(`$columnName` is null or `$columnName` = ?)",$searchvalue);
						else
							$sel->$UseWhere("`$columnName` = ?",$searchvalue);
						break;
				}
			}
		}
	}
}