<?php

/**
 * Idea from http://verens.com/2008/05/20/efficient-js-minification-using-php/
 * 
 * Freaking brilliant!!
 * 
 * This class takes all the files from the given directory and sub-directories
 * and minifies them into one cached file.
 * 
 * @author jstormes
 *
 */

class PHPSlickGrid_Minify_css {
	
	public $cache = "../library/PHPSlickGrid/cache/";
	
	function __construct($path="../library/PHPSlickGrid/public/", $cache="../library/PHPSlickGrid/cache/") {
		 
		$this->cache = $cache;
		$this->path  = $path;
	
	}
	
	function delete_old_md5s($folder) {
		$olddate=time()-3600;
		$dircontent = scandir($folder);
		foreach($dircontent as $filename) {
			if (strlen($filename)==32 && filemtime($folder.$filename) && filemtime($folder.$filename)<$olddate) unlink($folder.$filename);
		}
	}
	
	function md5_of_dir($folder) {
		$dircontent = scandir($folder);
		$ret='';
		foreach($dircontent as $filename) {
			if ($filename != '.' && $filename != '..') {
				if (filemtime($folder.$filename) === false) return false;
				$ret.=date("YmdHis", filemtime($folder.$filename)).$filename;
			}
		}
		return md5($ret);
	}
	
	
	/** 
	 * Get the md5 of the filepath and timestamp of every .js
	 * file in the given path.
	 *
	 * By: jstormes Feb 7, 2014
	 *
	 * @return string
	 */
	function md5_of_files() {
		$Directory = new RecursiveDirectoryIterator($this->path);
		$Iterator = new RecursiveIteratorIterator($Directory);
		$Regex = new RegexIterator($Iterator, '/^.+\.css$/i', RecursiveRegexIterator::GET_MATCH);
		
		$ret = '';
		foreach($Regex as $filename=>$Value) {
			$ret.=date("YmdHis", filemtime($filename)).str_replace($this->path,"",$filename);
		}
		
		return md5($ret);
	}
	
	/**
	 * return an array of every .js file in the path.
	 *
	 * By: jstormes Feb 7, 2014
	 *
	 * @param unknown $path
	 * @return multitype:mixed
	 */
	function files_direct() {
		
		$Directory = new RecursiveDirectoryIterator($this->path);
		$Iterator = new RecursiveIteratorIterator($Directory);
		$Regex = new RegexIterator($Iterator, '/^.+\.css$/i', RecursiveRegexIterator::GET_MATCH);
		
		$ret = array();
		foreach($Regex as $filename=>$Value) {
			$ret[]=str_replace($this->path,"",$filename);
		}
		
		return $ret;
	}
	
	
	function files_cached() {
		//$ret
	}
	
	function serve_file($file) {
		header("Content-type: text/css", true);
		//header('Content-type: text/javascript');
		//header('Expires: '.gmdate("D, d M Y H:i:s", time() + 3600*24*365).' GMT');
		$fp = fopen($this->path.$file, 'rb');
		fpassthru($fp);
		
		exit();
	}
	
	function add_files_to_view($view) {
		
		$action = $view->url(array("action"=>"service"));
		$files=$this->files_direct();
		
		foreach($files as $file) {
			$view->headLink()->appendStylesheet($action."?css=".$file);
			//$view->headScript()->appendFile($action."?css=".$file);
		}
	}
	
	
	
	function server() {
		header('Content-type: text/css');
		header('Expires: '.gmdate("D, d M Y H:i:s", time() + 3600*24*365).' GMT');
		
		$name=md5_of_dir('./');
		if(file_exists($writabledir.$name))readfile($writabledir.$name);
		else{
			$js=file_get_contents('jquery-1.2.3.min.js');
			$js.=file_get_contents('jquery.dimensions.pack.js');
			$js.=file_get_contents('jquery.impromptu.js');
			$js.=file_get_contents('jquery.iutil.pack.js');
			$js.=file_get_contents('jquery.idrag.js');
			$js.=file_get_contents('jquery.grid.columnSizing.js');
			$js.=file_get_contents('jquery.tablesorter.js');
			if(isset($_REQUEST['minify'])){
				require 'jsmin-1.1.1.php';
				$js=JSMin::minify($js);
				file_put_contents($writabledir.$name,$js);
				delete_old_md5s($writabledir);
				exit;
			}
			else{
				$js.="setTimeout(function(){var a=document.createElement('img');a.src='all.php?minify=1';a.style.display='none';document.body.appendChild(a);},5000);";
			}
			echo $js;
		}
	}
	
}