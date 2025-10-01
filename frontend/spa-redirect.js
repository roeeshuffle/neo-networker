function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check whether the URI is missing a file name or has a trailing slash
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    // Check whether the URI is missing a file extension
    else if (!uri.includes('.')) {
        request.uri += '/index.html';
    }
    
    return request;
}
