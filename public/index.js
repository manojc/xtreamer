(() => {
    "use strict"
    function postData(url, method, data, success, error) {
        var http = new XMLHttpRequest();
        http.onreadystatechange = function () {
            if (http.readyState == 4 && http.status == 200){
                let response = http.responseText;
                try {
                    response = JSON.parse(response);
                } catch (error) {}
                success(response);
            }
        }
        http.onerror = error;
        http.open(method, url, true); // true for asynchronous 
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.send(data);
    }

    function submitXML() {
        if (!fileInput || !fileInput.files || !fileInput.files.length) {
            return;
        }
        let formData = new FormData();        
        formData.append('file', fileInput, fileInput.name);
        if (rootNodeInput && !!rootNodeInput.value) {
            formData.append('node', rootNodeInput.value.trim());            
        }
        postData(`/api/${fileInput.files[0].name}`, "POST", formData, successCallback, errorCallback);
    }

    function submitURL() {
        if (!fileInput || !fileInput.value.trim()) {
            return;
        }
        postData(`/api/${encodeURIComponent(fileInput.value)}`, "POST", null, successCallback, errorCallback);
    }

    function successCallback(response) {
        console.log(response);
    }

    function errorCallback(error) {
        console.error(error);
    }       

    let submitButton = document.getElementById("submitBtn");
    let fileInput = document.getElementById("fileInput");
    let rootNodeInput = document.getElementById("rootNodeInput");
    submitButton.onclick = submitURL;
})();