<?php
class PHPSlickGrid_JSON_DataCache extends PHPSlickGrid_JSON_Abstract {
	
	/**
	 * returns the number of data items in the set
	 *
	 * @param array options
	 * @return integer
	 */
	public function getLength($options) {
		try
		{
			// TODO: this line does not work.
			$parameters=array_merge($options,$this->parameters);
			//throw new Exception(print_r($options,true),32001);
	
			$sel = $this->Table->select();
			$this->addConditionsToSelect($this->Config->conditions, $sel);
			$this->createWhere($sel, $options['where_list']);
			$sel->from($this->TableName,array('num'=>'COUNT(*)'));
			$Res = $this->Table->fetchRow($sel);
			return $Res->num;
		}
		catch (Exception $ex) {
			throw new Exception($ex,32001);
		}
	}
	 
	/**
	 * returns the item at a given index
	 *
	 * @param integer block
	 * @param array options
	 * @return array
	 */
	public function getBlock($block,$options) {
		//sleep(5); // Simulate a slow reply
		try
		{
			//$this->log->debug("getBlock");
			//throw new Exception(print_r($options,true));
			// Merge Options from both the controller and JSON call
			$parameters=array_merge_recursive($options,$this->parameters);
			//throw new Exception(print_r($parameters,true));
	
			$sel = $this->Table->select();
			$this->addConditionsToSelect($this->Config->conditions, $sel);
			$this->createWhere($sel, $options['where_list']);
			$sel->limit($options['blockSize'],$block*$options['blockSize']);
	
			// Build our order by
			foreach($parameters['order_list'] as $orderby) {
				$sel->order($orderby);
			}
	
			$Results = $this->Table->fetchAll($sel);
			if ($Results) {
// 				$res = array();
// 				foreach($Results->toArray() as $row) {
// 					$t = array();
// 					foreach($row as $key=>$val) {
// 						$t[$key]=iconv("utf-8","ASCII//IGNORE", $val);
// 					}
// 					$res[] = $t;
// 				}
				//return $res;
				return ($Results->toArray());
			}
			return null;
		}
		catch (Exception $ex) {
			throw new Exception($ex, 32001);
		}
	}
	
	/**
	 * return the date time of the newest record and the newest record by ID
	 *
	 * @param array options
	 * @return array
	 */
	public function getNewest($options=null) {
		try {
			$parameters=array_merge($options,$this->parameters);
	
			$Results = array();
	
	
			$sel=$this->Table->select();
			$this->addConditionsToSelect($this->Config->conditions, $sel);
			$sel->from($this->TableName, array(new Zend_Db_Expr("MAX(".$this->UpdatedColumn.") AS max_updt_dtm")));
			$row=$this->Table->fetchAll($sel);
			if ($row)
				$Results['max_updt_dtm']=$row->current()->toArray();
			else
				$Results['max_updt_dtm']=null;
	
			$sel=$this->Table->select();
			$sel->from($this->TableName, array(new Zend_Db_Expr("MAX(".$this->PrimaryKey.") AS max_id")));
			$row=$this->Table->fetchAll($sel);
			if ($row)
				$Results['max_id']=$row->current()->toArray();
			else
				$Results['max_id']=null;
	
			return $Results;
		}
		catch (Exception $ex) {
			throw new Exception($ex, 32001);
		}
	}
	
	/**
	 * return the primay keys of all rows that are newer than
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
			$parameters=array_merge_recursive($options,$this->parameters);
			$res = array();
			if (isset($updt_dtm)) {
				$sel = $this->Table->select();
				$this->addConditionsToSelect($this->Config->conditions, $sel);
				$sel->where($this->UpdatedColumn.' > ?',$updt_dtm);
				$res=$this->Table->fetchAll($sel);
				if (count($res)!=0) {
					//$this->log->debug("found new data ".$this->UpdatedColumn);
					return $res->toArray();
				}
			}
			return $res;
		}
		catch (Exception $ex) {
			throw new Exception($ex, 32001);
		}
	}
	
	/**
	 * update an existing row
	 *
	 * @param  array $row
	 * @param  array $options
	 * @return null
	 */
	public function updateItem($updt_dtm, $row, $options=null) {
		//sleep(5); // Simulate a slow reply
		try {
			//throw new Exception(print_r($this->PrimaryKey,true));
			$parameters=array_merge_recursive($options,$this->parameters);
	
			$Row=$this->Table->find($row[$this->PrimaryKey])->current();
			foreach($row as $Key=>$Value) {
				if (isset($Row[$Key])) {
					if ($Value=='null') $Value=null;
					$Row[$Key]=$Value;
				}
			}
			$Row[$this->UpdatedColumn]=null;
			$Row->save();
	
			return $this->getUpdated($updt_dtm,$options);
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
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
			//throw new Exception(print_r($this->PrimaryKey,true));
			//             $parameters=array_merge($options,$this->parameters);
	
			//             $this->log->debug($this->parameters);
	
			$NewRow=$this->Table->createRow();
	
			foreach($this->Config->staticFields as $field) {
				$NewRow[$field['field']]=$field['value'];
				$this->log->debug($field);
			}
	
			foreach($row as $Key=>$Value) {
				if (isset($NewRow[$Key])) {
					if ($Value=='null') $Value=null;
					$NewRow[$Key]=$Value;
				}
			}
	
	
			$NewRow[$this->UpdatedColumn]=null;
			$NewRow->save();
	
			return null;
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
	/**
	 * search and replace replace values
	 *
	 * @param  string $oleName
	 * @param  string $newName
	 * @param  string $column
	 * @param  array $options
	 * @return null
	 */
	public function replaceItems($oldValue, $newValue, $column, $where) {
		//sleep(5); // Simulate a slow reply
		try {
			//throw new Exception(print_r($this->PrimaryKey,true));
			//$parameters=array_merge_recursive($options,$this->parameters);
	
			//$this->log->debug("updated '".$oldValue."' to '".$newValue."'");
	
			if ($oldValue=='')
				$oldValue=null;
	
			$sel = $this->Table->select();
			$this->addConditionsToSelect($this->Config->conditions, $sel);
			$this->createWhere($sel, $where);
	
			$whereData = $sel->getPart( Zend_Db_Select::WHERE );
	
			if ($oldValue=='')
				$whereData[] = " AND ($column = '' or $column is null) ";
			else
				$whereData[] = " AND ($column = '$oldValue') ";
	
			$newWhere=implode(' ',$whereData);
	
			//$this->log->debug(print_r($newWhere,true));
			//return array();
	
			$db=$this->Table->getAdapter();
	
			$n = $db->update($this->TableName,array($column=>$newValue),$newWhere);
	
			//$this->log->debug("updated ".$n);
	
		}
		catch (Exception $ex) {
			if (strstr($ex->getMessage(),'foreign key constraint fails')) {
				$ex = "That value cannot be used in these cells.";
			}
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
}