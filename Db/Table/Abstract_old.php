<?php
class PHPSlickGrid_Db_Table_Abstract_old extends Zend_Db_Table_Abstract
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
	 * Column to track row updates
	 * 
	 * @var string
	 */
	protected $upd_dtm_col = null;
	
	/**
	 * Column to track row deletes
	 * 
	 * @var string
	 */
	protected $deleted_col = null;
	
	
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
			
		/* Default the grid name to the table name. */
		$this->_gridName = $this->_name;
		
		parent::__construct();
		
		/* Initialize the grid configuration. */
		$this->_gridConfig = new PHPSlickGrid_GridConfig();
		$this->_gridConfig->gridName	= $this->_gridName;
		$this->_gridConfig->tableName	= $this->_name;
		
		// Get primary key column.
		if (is_string($this->_primary)) {
			$this->_gridConfig->primay_col = $this->_gridName."$".$this->_primary;
			$this->primary_col = $this->_primary;
		}
		
		// Get time stamp column
		$this->_setupMetadata();
		foreach($this->_metadata as $Value) {
			if ($Value['DEFAULT']=='CURRENT_TIMESTAMP') {
				$this->_gridConfig->upd_dtm_col=$this->_gridName."$".$Value['COLUMN_NAME'];
				$this->upd_dtm_col = $Value['COLUMN_NAME'];
				break;
			}
		}
			
		/* Initialize the column configuration. */
		$this->_columnConfig = new PHPSlickGrid_ColumnConfig($this, $this->_metaTable, $this->_ACL, $this->_currentRole);
		
		$this->_gridInit();
		
		$grid_length = $this->getLength(array());
		$this->_gridConfig->gridLength = $grid_length['gridLength']; // filtered row count
		$this->_gridConfig->totalRows = $grid_length['totalRows']; // unfiltered row count
		$this->_gridConfig->maxPrimary = $this->getMaxPrimary(); // unfiltered row count
		
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
	
	
	public function buildSelect($state=null) {
		
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
	

	public function addConditionsToSelect(Zend_Db_Select $select) {
		return $select;
	}
	
	public function getLength($state=null) {

		try
		{	
			$Res = array();
			
			// Get row count for grid
			$select = $this->buildSelect($state);
			$select = $this->addConditionsToSelect($select);
			
			// Apply user filters
			//$select = $this->addFilters($select, $state);
			
			$count_select = $this->select();
			$count_select->setIntegrityCheck(false);
			$count_select->from(new Zend_Db_Expr("(".$select.")"), 'COUNT(*) as num');
			$row = $this->fetchRow($count_select);
			$Res['gridLength'] = $row->num;
			
			// Get total possible rows
			$select = $this->buildSelect($state);
			$select = $this->addConditionsToSelect($select);
			$count_select = $this->select();
			$count_select->setIntegrityCheck(false);
			$count_select->from(new Zend_Db_Expr("(".$select.")"), 'COUNT(*) as num');
			$row = $this->fetchRow($count_select);
			$Res['totalRows'] = $row->num;
			
			/*
			 * Return the counts
			 */
			return $Res;
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}
		
	}
	
	public function getMaxPrimary($state=null) {
		try
		{
			// Get Maximum primary key value
			$select = $this->buildSelect($state);
			$select = $this->addConditionsToSelect($select);
				
			// Apply user filters
			//$select = $this->addFilters($select, $state);
				
			$count_select = $this->select();
			$count_select->setIntegrityCheck(false);
			$count_select->from(new Zend_Db_Expr("(".$select.")"), "MAX(".$this->_gridConfig->primay_col.") as num");
			$row = $this->fetchRow($count_select);
			
			return $row->num;
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}
	}
	
	public function LimitSelectToMaxPrimary(Zend_Db_Select $select, $state) {
		$select->where($this->primary_col."<= ?", $state['maxPrimary']);
		return $select;
	}
	
	public function getBlock($block,$state) {
		
		try
		{
			//return array();
			// Merge javascript options with php parameters.
			//$parameters=array_merge_recursive($options,$this->parameters);
			
			$select = $this->buildSelect($state);
			$select = $this->addConditionsToSelect($select);
			$select = $this->LimitSelectToMaxPrimary($select, $state);
			$select->limit($state['blockSize'],$block*$state['blockSize']);
			
			// Build our order by
			foreach($state['order_list'] as $orderby) {
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
	
	public function LimitSelectToNewRecords(Zend_Db_Select $select, $state) {
		$select->where($this->primary_col."> ?", $state['maxPrimary']);
		return $select;
	}
	
	public function getNewBlock($block,$state) {
	
		try
		{
			//return array();
			// Merge javascript options with php parameters.
			//$parameters=array_merge_recursive($options,$this->parameters);
				
			$select = $this->buildSelect($state);
			$select = $this->addConditionsToSelect($select);
			$select = $this->LimitSelectToNewRecords($select, $state);
			$select->limit($state['blockSize'],$block*$state['blockSize']);
				
			// ****** No order by for new records ********
			// Build our order by
			//foreach($state['order_list'] as $orderby) {
			//	$select->order($orderby);
			//}
				
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
	 * @param array pollRequest
	 * @return array
	 */
	public function SyncDataCache($state) {
		//throw new Exception('Error Msg', 32001);
		//sleep(10);
		try {
			
			if ($state==null)
				return null;
			
			$this->PollRequest($state);
			
			$pollResponse = array();
			
			$pollResponse['updatedRows']= array();
			
			
			// Calculate block size for block and the end of length
			// so we can send new records vs updated records.
			
			
			if (count($state['activeBuffers'])>0) {
			
				foreach($state['activeBuffers'] as $block) {
					
					
					// Build select (TODO: This is the same logic as GetBlock.  Re-factor for only one version.)
					$select = $this->buildSelect($state);
					$select = $this->addConditionsToSelect($select);
					$select->limit($state['blockSize'],$block*$state['blockSize']);
						
					// Build our order by
					foreach($state['order_list'] as $orderby) {
						
						$select->order($orderby);
					}
					
					$select->where($this->upd_dtm_col." > ?",$state['newestRecord']);
					
					$updated_rows = $this->fetchAll($select)->toArray();
					
					if (count($updated_rows)>0) {
						foreach($updated_rows as $row)
							array_push($pollResponse['updatedRows'], $row);
					}
				}

			}
			
			$pollResponse['datalength']=$this->getLength($state);
			//if ($pollResponse['datalength']>$pollRequest['options'])
			
			$pollResponse=$this->PollReply($pollResponse);
			
			return $pollResponse;
		}
		catch (Exception $ex) {
			throw new Exception($ex, 32001);
		}
	}
	
	/**
	 * Hook for adding data to a poll reply.
	 * 
	 * Thanks to Dave Davidson.
	 *
	 * By: jstormes Mar 27, 2014
	 *
	 * @param unknown $data
	 * @return unknown
	 */
	private function PollReply($data) {
		return $data;
	}
	
	/**
	 * Hook for receiving data from a poll request.
	 * 
	 * Thanks to Dave Davidson.
	 *
	 * By: jstormes Mar 27, 2014
	 *
	 * @param unknown $data
	 * @return unknown
	 */
	private function PollRequest($data) {
		return $data;
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
	
	public function _updateItem($row, $state) {
		return $row;
	}
	
	/**
	 * update an existing row
	 *
	 * @param  array $row
	 * @param  array $options
	 * @return array
	 */
	public function updateItem($row, $state=null) {

		try {
			// Remove any tables references from column names.
			$row = $this->RemoveTableRefrence($row);
			
			if ($this->upd_dtm_col !== null)
				$row[$this->upd_dtm_col]=null;
			
			// Perform any updateItem logic
			$row = $this->_updateItem($row, $state);
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
			return $this->SyncDataCache($state);
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
	
	public function _addItem($row,$state) {
		return $row;
	}
	
	/**
	 * add a new row
	 *
	 * @param  array $row
	 * @param  array $options
	 * @return null
	 */
	public function addItem($row,$state=null) {
		
		try {
			// Remove any tables references from column names.
			$row=$this->RemoveTableRefrence($row);
			
			// Perform any custom addItem logic
			$row=$this->_addItem($row,$state);
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
			return $this->SyncDataCache($state);
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
	public function deleteItem($row, $state=null) {
		//sleep(5); // Simulate a slow reply
		try {
			// Remove any tables references from column names.
			$row = $this->RemoveTableRefrence($row);
			
			// Perform any custom deleteItem logic
			$row=$this->_deleteItem($row,$state);
			if ($row===null) return null;  	// if custom delete logic returns null,
											// it handled the delete.
			
			// Find the exiting Row in the database to update
			$Row=$this->find($row[$this->_primary[1]])->current();
			$Row->delete();
	
			return $this->SyncDataCache($state);
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
}