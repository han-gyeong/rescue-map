// 전역변수 선언부분
var map;
var mapContainer;
var lat;
var lon;
var geocoder;
var sidoname;
var markers = [];

window.onload = mapMaker; // 일단 맵을 만드는것으로 시작합니다.

function mapMaker() {
	mapContainer = document.getElementById('map'),
    mapOption = { 
        center: new kakao.maps.LatLng(47.624851, -122.52099),
        level: 3 // 지도의 확대 레벨
    };

	map = new kakao.maps.Map(mapContainer, mapOption);
	geocoder = new kakao.maps.services.Geocoder();
	locator(); // 맵을 다 만들면 위치를 찾아봅시다.
}

function locator() {
if (navigator.geolocation)
{
	navigator.geolocation.getCurrentPosition(function(position) {
		
		lat = position.coords.latitude;
		lon = position.coords.longitude;
		var locPosition = new kakao.maps.LatLng(lat, lon);
		
		displayMarker(locPosition);
		geocoder.coord2RegionCode(lon, lat, function(result,status) {
			// 시까지의 이름을 받아오고 성공하면 shelter 로 넘어가자.
			// 구까지 받아오는 경우가 존재하여 스페이스바를 기준으로 글자를 나눠서, 앞글자를 가져올것이다.
			sidoname = result[0].region_1depth_name + ' ' + result[0].region_2depth_name.split(" ")[0];
			shelter();
		});
	});

} else {
	var locPosition = new kakao.maps.LatLng(47.624851, -122.52099);
	alert("Geolocation is unavailable. Please check your browser");
	location.reload(true); // GEOLOCATION이 불가능할 경우 새로고침을 합니다.
	}
}

function displayMarker(locPosition) {
	var imageSrc = 'image/reddot.png', imageSize = new kakao.maps.Size(30,30);
	var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

	var marker = new kakao.maps.Marker({
		map: map,
		image: markerImage,
		position: locPosition
	});

	map.setCenter(locPosition);
}


function shelter() {
	// php 로 프록시를 사용하였다. 하지만 API 서버의 속도가 느려 정보를 받아오는데 시간이 오래 소요된다.
	// 위치에 따라 sidoname을 받아와서, 해당 위치에 있는 대피소만 정보를 받아오도록 한다.
	//var url = "src/proxy.php?area=" + sidoname;
	// 다음 주석을 해제해서 안성시만 JSON 파일에 옮긴 정보를 얻어올 수 있다.
	var url = "shelter.json";
	$.getJSON(url, updateInfo);
}

function degreesToRadians(degrees) {
	radians = (degrees * Math.PI)/180;
	return radians;
}

function computeDistance(startlat, startlon, destlat, destlon) {
	var startLatRads = degreesToRadians(startlat);
	var startLongRads = degreesToRadians(startlon);
	var destLatRads = degreesToRadians(destlat);
	var destLongRads = degreesToRadians(destlon);

	var Radius = 6371; // radius of the Earth in km
	var distance = Math.acos(Math.sin(startLatRads) * Math.sin(destLatRads) + 
					Math.cos(startLatRads) * Math.cos(destLatRads) *
					Math.cos(startLongRads - destLongRads)) * Radius;

	return distance;
}

function updateInfo(str) {
	// MARKER IMAGE의 다중 정의를 막기 위하여 한번에 위에 써준다.
	var imageSrc = 'image/marker-black.png', imageSize = new kakao.maps.Size(30,30);
	var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

	for (var i = 0; i<str.length; i++)
	{
		var markerPosition = new kakao.maps.LatLng(str[i].위도, str[i].경도);
		var marker = new kakao.maps.Marker({
			image: markerImage,
			position: markerPosition
		});
	
		markers.push(marker); // marker를 markers 배열에 추가합니다.
		marker.setMap(map); // marker를 지도 위에 추가합니다.
	
		str[i].number = i;
		str[i].distance = computeDistance(lat, lon, str[i].위도, str[i].경도);
		if (str[i].distance < 1) // 1km 반경내일때 table의 내용에 추가하도록 한다.
		{
			insertTable(str[i].number, str[i].지진해일대피소명, str[i].소재지도로명주소, str[i].지진해일대피소전화번호, str[i].최대수용인원수, str[i].지진해일대피소유형, str[i].distance.toFixed(2));
		}
	}
	sortTable(); // 거리순에 따라 테이블을 정렬합니다.
	tableHandlers(); // 테이블 마다 mouseover 과 out에 발생하는 event 를 추가해줍니다.
}

// 삽입할때 비교해서 작으면 위에 크면 아래에 삽입하도록 해봅시다.
function insertTable(number, name, address, contact, max, type, distance) {
	var tbody = document.getElementById("rescueinfo");
	//alert("InsertTable 진입");
	var tr = document.createElement("tr");
	var td1 = document.createElement("td");
	td1.innerHTML = number;
	var td2 = document.createElement("td");
	td2.innerHTML = name;
	var td3 = document.createElement("td");
	td3.innerHTML = address;
	var td4 = document.createElement("td");
	td4.innerHTML = contact;
	var td5 = document.createElement("td");
	td5.innerHTML = max;
	var td6 = document.createElement("td");
	td6.innerHTML = type;
	var td7 = document.createElement("td");
	td7.innerHTML = distance + "km";

	tr.appendChild(td1);
	tr.appendChild(td2);
	tr.appendChild(td3);
	tr.appendChild(td4);
	tr.appendChild(td5);
	tr.appendChild(td6);
	tr.appendChild(td7);

	tbody.appendChild(tr);
}

function sortTable() // 거리에 따라 테이블을 Sorting 하기 위한 함수이다.
	{
	var table, rows, switching, i, x, y, shouldSwitch;
	table = document.getElementById("rescueinfo");
	switching = true;
	while(switching) {
		switching = false;
		rows = table.rows;
		for (i=0; i < (rows.length - 1); i++)
		{
			shouldSwitch = false;
			x = rows[i].cells[6];
			y = rows[i+1].cells[6];
			if (x.innerHTML > y.innerHTML)
			{
				shouldSwitch = true;
				break;
			}
		}
		if (shouldSwitch)
		{
			rows[i].parentNode.insertBefore(rows[i+1], rows[i]);
			switching = true;
		}
	}
}

function tableHandlers() {
	var table = document.getElementById("rescueinfo");
	var rows = table.getElementsByTagName("tr");
	for (var i = 0; i < rows.length; i++)
	{
		var currentRow = table.rows[i];
		var mouseoverHandler = function(row) { // over 될 경우에 Red로 변경합니다.
			return function() {
				var imageSrc = 'image/marker-red.png', imageSize = new kakao.maps.Size(50,50);
				var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);
				var key = row.getElementsByTagName("td")[0].innerHTML; // key 를 불러온다.
				//해당 키를 가진 리스트의 위도 경도를 받는다, 해당 좌표에 있는 마커를 지워버리고 새로운 빨간색 마커로 추가한다.
				var MarkerCurrentLocation = markers[key].getPosition();
				markers[key].setMap(null);

				var marker = new kakao.maps.Marker({
					image: markerImage,
					position: MarkerCurrentLocation
				});
				markers[key] = marker;
				marker.setMap(map);
				};
			};

		var mouseoutHandler = function(row) { // out 될경우에 원래 마커인 black으로 돌아갑니다.
			return function() {
				var imageSrc = 'image/marker-black.png', imageSize = new kakao.maps.Size(40,40);
				var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);
				var key = row.getElementsByTagName("td")[0].innerHTML; // key 를 불러온다.
				//해당 키를 가진 리스트의 위도 경도를 받는다, 해당 좌표에 있는 마커를 지워버리고 새로운 빨간색 마커로 추가한다.
				var MarkerCurrentLocation = markers[key].getPosition();
				markers[key].setMap(null);

				var marker = new kakao.maps.Marker({
					image: markerImage,
					position: MarkerCurrentLocation
				});
				markers[key] = marker;
				marker.setMap(map);
			};
		};

		currentRow.addEventListener("mouseover", mouseoverHandler(currentRow)); // over 되면 marker를 red로 바꿔주는 overHandler
		currentRow.addEventListener("mouseout", mouseoutHandler(currentRow)); // out 되면 원래로 돌려주는 outHandler
	}
}