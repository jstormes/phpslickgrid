<?php
/**
 * Override setClass in Zend_Json_Server so that we can
 * ignore non compliant names.
 * 
 * @author jstormes
 *
 */

class PHPSlickGrid_JSON_Server extends Zend_Json_Server
{
	/**
	 * Register a class with the server
	 *
	 * @param  string $class
	 * @param  string $namespace Ignored
	 * @param  mixed $argv Ignored
	 * @return Zend_Json_Server
	 */
	public function setClass($class, $namespace = '', $argv = null)
	{
		$argv = null;
		if (3 < func_num_args()) {
			$argv = func_get_args();
			$argv = array_slice($argv, 3);
		}
	
		require_once 'Zend/Server/Reflection.php';
		$reflection = Zend_Server_Reflection::reflectClass($class, $argv, $namespace);
	
		foreach ($reflection->getMethods() as $method) {
			if ('_' == substr($method->getName(), 0, 1)) {
                continue;
            }
			$definition = $this->_buildSignature($method, $class);
			$this->_addMethodServiceMap($definition);
		}
		return $this;
	}
}