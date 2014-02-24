<?php
class PHPSlickGrid_Db_Table_Abstract extends Zend_Db_Table_Abstract
{	
	/**
	 * Grid Name
	 * 
	 * @var string
	 */
	protected $_gridName = '';
	
	/**
	 * Grid Configuration
	 * 
	 * @var PHPSlickGrid_GridConfig
	 */
	protected $_gridConfig = null;

	
	/**
	 * Column Configuration
	 * 
	 * @var PHPSlickGrid_ColumnConfig
	 */
	protected $_columnConfig = null;
	
	/**
	 * Table used to store meta data about columns 
	 * 
	 * @var unknown
	 */
	protected $_metaTable = null;
	
	/**
	 * Zend Acl used for table security
	 * 
	 * @var Zend_Acl
	 */
	protected $_ACL = null;
	
	/**
	 * Current role
	 * 
	 * @var string
	 */
	protected $_currentRole = null;
	
	/**
	 * Total row count
	 * 
	 * @var integer
	 */
	protected $_totalLength = 0;
	
	/**
	 * Logging Object
	 * 
	 * @var Zend_Log
	 */
	protected $log = null;
	
	
	/**
	 * Call the existing constructor then initialize our PHPSlickGrid 
	 * properties.
	 *
	 * By: jstormes Feb 5, 2014
	 *
	 * @param unknown $config
	 */
	public function __construct($config = array())
	{	
		// Setup our log, very useful for debugging.
		if (Zend_Registry::isRegistered('log')) {
			$this->log = Zend_Registry::get('log');
		}
		else {
			$this->log = new Zend_Log();
			$writer_firebug = new Zend_Log_Writer_Firebug();
			$this->log->addWriter($writer_firebug);
		}
		
		parent::__construct();
		
		/* Default the grid name to the table name. */
		$this->_gridName = $this->_name;
		
		/* Initialize the grid configuration. */
		$this->_gridConfig = new PHPSlickGrid_GridConfig();
		$this->_gridConfig->gridName	= $this->_gridName;
		$this->_gridConfig->tableName	= $this->_name;
		
		/* Initialize the column configuration. */
		$this->_columnConfig = new PHPSlickGrid_ColumnConfig($this, $this->_metaTable, $this->_ACL, $this->_currentRole);
		
		$this->_gridConfig->gridLength = $this->getLength(array());
		
		$this->_gridInit();
	}
	
	protected function _gridInit() {
		
		
	}
	
	/**
	 * Get the grid configuration
	 *
	 * By: jstormes Feb 5, 2014
	 *
	 * @return PHPSlickGrid_GridConfig
	 */
	public function getGridConfiguration(){
		return $this->_gridConfig;
	}
	
	/**
	 * Get the column configuration
	 *
	 * By: jstormes Feb 5, 2014
	 *
	 * @return PHPSlickGrid_ColumnConfig
	 */
	public function getColumnConfiguration() {
		return $this->_columnConfig;
	}
	
	public function getTableName() {
		return $this->_name;
	}
	
	/**
	 * 
	 *
	 * By: jstormes Feb 10, 2014
	 *
	 * @return string
	 */
	public function getGridName() {
		return $this->_gridName;
	}
	
	/**
	 * Set the grid name.
	 *
	 * By: jstormes Feb 5, 2014
	 *
	 * @param unknown $grid_name
	 */
	public function setGridName($grid_name) {
		$this->_gridName				= $grid_name;
		$this->_gridConfig->gridName	= $this->_gridName;
	}
	
	
	public function buildSelect($options) {
		
		$info=$this->info();
		
		// Make column aliases - "(table name).(column name) as (table name)$(column name)"
		$column = array();
		foreach($info['cols'] as $key=>$value) {
			$columns[$info['name']."$".$value]=$info['name'].".".$value;
		}
		
		$select = $this->select();
		$select->setIntegrityCheck(false);
		$select->from(array($info['name'] => $info['name']),$columns);
		
		return $select;
	}
	
	public function getLength($options) {

		try
		{
			// Merge javascript options with php parameters.
			//$parameters=array_merge_recursive($options);
			
			$select = $this->buildSelect($options);
			
			//$this->addConditionsToSelect($this->Config->table_name,$this->Config->conditions, $select);
			//$this->createWhere($select, $options['where_list']);
			//$this->log->debug($select." ");
			
			
			$count_select = $this->select();
			$count_select->setIntegrityCheck(false);
			$count_select->from(new Zend_Db_Expr("(".$select.")"), 'COUNT(*) as num');
					
			/*
			 * Return the count of records
			 */
			$Res = $this->fetchRow($count_select);
			return $Res->num;
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}
		
	}
	
	public function getBlock($block,$options) {
		
		try
		{
			//return array();
			// Merge javascript options with php parameters.
			//$parameters=array_merge_recursive($options,$this->parameters);
			
			$select = $this->buildSelect($options);
			$select->limit($options['blockSize'],$block*$options['blockSize']);
			
			// Build our order by
			foreach($options['order_list'] as $orderby) {
				$select->order($orderby);
			}
			
			/*
			 * Explode the results into row[Index][Table Name][Column] format
			*/
			$Results = $this->fetchAll($select)->toArray();

			return ($Results);
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}

	}
	
	/**
	 * return the primary keys of all rows that are newer than
	 * the passed date.
	 *
	 * NOTE: if date created=date updated then don't return that row.
	 * Keeps the system from jumping rows???????
	 *
	 * @param string updt_dtm
	 * @param array options
	 * @return array
	 */
	public function getUpdated($updt_dtm,$options=null) {
		//throw new Exception('Error Msg', 32001);
		//sleep(10);
		try {
			//$parameters=array_merge_recursive($options,$this->parameters);
			$res = array();
			if (isset($updt_dtm)) {
				
			}
			return $res;
		}
		catch (Exception $ex) {
			throw new Exception($ex, 32001);
		}
	}
	
	
	private function AddTableRefrence($row) {
		
		$info=$this->info();
		$Row = array();
		
		foreach($row as $Key=>$Value) {
			$Key = str_replace($info['name']."$", "", $Key);
			$Row[$info['name']."$".$Key]=$Value;
		}
		
		return $Row;
	}
	
	private function RemoveTableRefrence($row) {
		
		$info=$this->info();
		$Row = array();
		
		foreach($row as $Key=>$Value) {
			$Key = str_replace($info['name']."$", "", $Key);
			$Row[$Key]=$Value;
		}
		
		return $Row;
	}
	
	public function _updateItem($row, $options) {
		return $row;
	}
	
	/**
	 * update an existing row
	 *
	 * @param  array $row
	 * @param  array $options
	 * @return null
	 */
	public function updateItem($updt_dtm, $row, $options=null) {
		
		try {
			// Remove any tables references from column names.
			$row = $this->RemoveTableRefrence($row);
			
			// Perform any updateItem logic
			$row = $this->_updateItem($row, $options);
			if ($row===null) return null;  // if null update logic short circuited update.
			
			// Find the exiting Row in the database to update
			$Row=$this->find($row[$this->_primary[1]])->current();
			
			// Copy values from the array to the existing row object.
			foreach($row as $Key=>$Value) {
				if (isset($Row[$Key])) {
					if ($Value=='null') $Value=null;
						$Row[$Key]=$Value;
				}
			}
 			
			// Save the row back into the database.
			$Row->save();
	
			// return any rows updated from the last time this was called.
			return $this->getUpdated($updt_dtm,$options);
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
	
	public function _addItem($row,$options) {
		return $row;
	}
	
	/**
	 * add a new row
	 *
	 * @param  array $row
	 * @param  array $options
	 * @return null
	 */
	public function addItem($row,$options=null) {
		
		try {
			// Remove any tables references from column names.
			$row=$this->RemoveTableRefrence($row);
			
			// Perform any custom addItem logic
			$row=$this->_addItem($row,$options);
			if ($row===null) return null;  	// if custom add logic returns null,
											// it handled the add.
				
			// Create the new row object
			$NewRow=$this->createRow();	
	
			// Copy values from the array to the new row object.
			foreach($row as $Key=>$Value) {
				if (isset($NewRow[$Key])) {
					if ($Value=='null') $Value=null;
					$NewRow[$Key]=$Value;
				}
			}
			
			// Save the new row.
			$NewRow->save();
			
			// Pass the new row array back to javascript.
			return $row;
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
	
	public function _deleteItem($row,$options) {
		return $row;
	}
	
	/**
	 * delete an existing row
	 *
	 * @param  array $row
	 * @param  array $options
	 * @return null
	 */
	public function deleteItem($row, $options=null) {
		//sleep(5); // Simulate a slow reply
		try {
			// Remove any tables references from column names.
			$row = $this->RemoveTableRefrence($row);
			
			// Perform any custom deleteItem logic
			$row=$this->_deleteItem($row,$options);
			if ($row===null) return null;  	// if custom delete logic returns null,
											// it handled the delete.
			
			// Find the exiting Row in the database to update
			$Row=$this->find($row[$this->_primary[1]])->current();
			$Row->delete();
	
			return null;
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
}