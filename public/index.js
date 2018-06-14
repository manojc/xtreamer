(() => {
    "use strict"
    function postData(url, method, data, success, error) {
        var http = new XMLHttpRequest();
        http.onreadystatechange = function () {
            if (http.readyState == 4 && http.status == 200)
                success(JSON.parse(http.responseText));
        }
        http.onerror = error;
        http.open(method, url, true); // true for asynchronous 
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.send(JSON.stringify(data));
    }
    postData('/api/get-xml', "GET", null, (response) => {
        console.log(response);
    }, (error) => {
        console.log(error);
    });
})();