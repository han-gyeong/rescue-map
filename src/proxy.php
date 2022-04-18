<?php
	$area = $_GET['area'];
	$area = urlencode($area);
	$url = "http://api.data.go.kr/openapi/erthqktdlwavshltr-std?serviceKey=fhIEoMOsp8HpDRU1XmOwtC7MJsEL8a0uKxQWnHGPbjtXk%2Bt0r0dJ2t2b2yJL5t8eVQ4adcJe7cWKZ0sHf%2FBkZQ%3D%3D&s_page=0&s_list=100&type=json&instt_nm=";
	$link = $url.$area;
	echo file_get_contents($link);
?>