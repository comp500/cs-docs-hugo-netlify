/*global MathJax*/

var updatedContentAvailable = false;
var currentState = null;

window.addEventListener("load", function() {
	document.getElementById("menuLink").addEventListener("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		// toggle article and nav when menu link is clicked
		document.getElementById("mainNav").classList.toggle("nav-open");
		document.getElementById("mainArticle").classList.toggle("nav-open");
		return false;
	}, false);

	var searchInput = document.getElementById("searchInput");
	
	var setupSearch = function (searchIndex, resultObjects) {
		var previousSearches = [];
		var previousResultIndexes = [];

		var searchItemsList = document.getElementById("searchItems");
		var existingItems = document.getElementById("existingItems");

		// Focus search box
		searchInput.focus();

		searchInput.addEventListener("input", function(e) {
			// show and hide existingItems to make room for search results
			var searchQuery = e.target.value.trim();
			if (searchQuery.length > 0) {
				searchItemsList.classList.add("shown");
				existingItems.classList.add("hidden");
			} else {
				searchItemsList.classList.remove("shown");
				existingItems.classList.remove("hidden");
				return true;
			}

			var previousSearch = previousSearches.findIndex(function (search) {
				if (searchQuery.toLowerCase() == search) {
					return true;
				} else {
					return false;
				}
			});

			var result = [];
			if (previousSearch > -1) {
				previousResultIndexes[previousSearch].forEach(function (item) {
					result.push(resultObjects[item]);
				});
			} else {
				var newSearch = [];
				searchIndex.forEach(function (item, index) {
					if (item.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1) {
						newSearch.push(index);
					}
				});

				previousSearches.push(searchQuery);
				previousResultIndexes.push(newSearch);
				if (previousSearches.length > 10) {
					previousSearches.shift();
					previousResultIndexes.shift();
				}

				newSearch.forEach(function (item) {
					result.push(resultObjects[item]);
				});
			}

			searchItemsList.innerHTML = "";
			result.forEach(function (item, index) {
				var link = "<li>";
				link += "<span class=\"module\">" + item.module + "</span> ";
				if (index == 0) {
					link += "<a href=\"" + item.href + "\" id=\"topSearchItem\">" + item.pageTitle + "</a>";
				} else {
					link += "<a href=\"" + item.href + "\">" + item.pageTitle + "</a>";
				}
				link += "</li>"
				searchItemsList.innerHTML += link;
			});
		}, false);
		
		searchInput.addEventListener("keyup", function(e) {
			if (e.keyCode != 13) {
				return true;
			}
			if (e.target.value.trim().length > 0) {
				var topSearchItem = document.getElementById("topSearchItem");
				if (topSearchItem != null) {
					topSearchItem.click(); // fake a click
					return false;
				}
			} else {
				return true;
			}
		}, false);
	};

	// Start XHR for search
	var xhr = new XMLHttpRequest();
	xhr.open('GET', "/search.json", true);

	xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var searchAjax;
			try {
				searchAjax = JSON.parse(this.responseText);
			} catch (e) {
				searchInput.setAttribute("placeholder", "Search loading failed");
				return;
			}
			
			if (searchAjax.searchIndex && searchAjax.resultObjects) {
				setupSearch(searchAjax.searchIndex, searchAjax.resultObjects);
				searchInput.removeAttribute("disabled");
				searchInput.setAttribute("placeholder", "Search...");
			} else {
				searchInput.setAttribute("placeholder", "Search loading failed");
			}
		} else if (this.readyState == 4 && this.status != 200) {
			searchInput.setAttribute("placeholder", "Search loading failed");
		}
	};
	
	xhr.send();

	var expandHandler = function (e) {
		e.preventDefault();
		e.stopPropagation();

		// Loop through nodes to find ul
		var otherNodes = e.target.parentNode.childNodes;
		var state = 0;
		if (otherNodes) {
			for (var i = 0; i < otherNodes.length; i++) {
				if (otherNodes[i].tagName == "UL") {
					otherNodes[i].classList.toggle("expanded");
					state = otherNodes[i].classList.contains("expanded") ? 2 : 1;
				}
			}
		}

		if (state > 0) {
			if (state == 2) {
				e.target.innerText = "⯆";
			} else {
				e.target.innerText = "⯈";
			}
		}

		return false;
	};

	// Add listener to all expand elements
	Array.from(document.getElementsByClassName("expand")).forEach(function (item) {
		item.addEventListener("click", expandHandler, false);
	});

	// Register service worker
	if ('serviceWorker' in navigator) {
		// From https://github.com/GoogleChromeLabs/sw-precache/blob/master/demo/app/js/service-worker-registration.js
		navigator.serviceWorker.register('/service-worker.js').then(function(reg) {
			// updatefound is fired if service-worker.js changes.
			reg.onupdatefound = function() {
				// The updatefound event implies that reg.installing is set; see
				// https://w3c.github.io/ServiceWorker/#service-worker-registration-updatefound-event
				var installingWorker = reg.installing;

				installingWorker.onstatechange = function() {
					switch (installingWorker.state) {
						case 'installed':
							if (navigator.serviceWorker.controller) {
								// At this point, the old content will have been purged and the fresh content will
								// have been added to the cache.
								// It's the perfect time to display a "New content is available; please refresh."
								// message in the page's interface.
								updatedContentAvailable = true;
								console.log('New or updated content is available.');
							} else {
								// At this point, everything has been precached.
								// It's the perfect time to display a "Content is cached for offline use." message.
								console.log('Content is now available offline!');
							}
							break;

						case 'redundant':
							console.error('The installing service worker became redundant.');
							break;
					}
				};
			};
		}).catch(function(e) {
			console.error('Error during service worker registration:', e);
		});
	}
}, false);

var currentTimeoutID;
var expandElement = function (el, targetName) {
	// Loop through nodes to find ul
	var otherNodes = el.childNodes;
	var shouldExpand = false;
	var ulNode = null;
	var expandNode = null;
	if (el && otherNodes) {
		for (var i = 0; i < otherNodes.length; i++) {
			if (otherNodes[i].tagName == "UL") {
				ulNode = otherNodes[i];
				if (!shouldExpand && ulNode.childNodes) {
					for (var j = 0; j < ulNode.childNodes.length; j++) {
						shouldExpand = expandElement(ulNode.childNodes[j], targetName);
						if (shouldExpand) {
							break;
						}
					}
				}
			}
			if (otherNodes[i].tagName == "A") {
				if (otherNodes[i].classList.contains("expand")) {
					expandNode = otherNodes[i];
				} else {
					if (!shouldExpand) {
						if (targetName == otherNodes[i].innerText) {
							// Found names to be equal!
							shouldExpand = true;
						}
					}
				}
			}
		}
	}

	if (shouldExpand) {
		if (ulNode != null && expandNode != null) {
			ulNode.classList.add("expanded");
			expandNode.innerText = "⯆";
		}
		return true;
	} else {
		if (expandNode != null) {
			expandNode.innerText = "⯈";
		}
		if (ulNode != null) {
			ulNode.classList.remove("expanded");
		}
	}

	return false;
};

window.addEventListener("click", function(e) {
	if (e.target.nodeName == "A" && e.button == 0) {
		// handle links on current host with xhr
		if (e.target.host == window.location.host) {
			// if it is on the same page, but different hash
			if (e.target.pathname == window.location.pathname &&
				e.target.hash.length > 0
			) {
				return false; // don't handle event
			}

			// if updated content is available, don't handle
			if (updatedContentAvailable) {
				return false;
			}

			e.preventDefault();
			var title = e.target.innerText;
			if (title == "Home") {
				title = "Computing Documentation";
			}
			var path = e.target.pathname;
			var href = e.target.href;
			var pathreplaced = path.replace("/", "/partials/");
			var pathreplaced2 = path.replace(/\/$/, "/partials/");

			var xhr = new XMLHttpRequest();
			xhr.open('GET', pathreplaced, true);
			
			var progressBar = document.getElementById("progress-bar");
			// fade in progress bar
			progressBar.style.opacity = "0.8";
			progressBar.style.width = "20%";

			if (currentTimeoutID) {
				// reset timeouts, to prevent animation problems
				window.clearTimeout(currentTimeoutID);
			}

			var stateChange = function() {
				if (this.readyState != 4) {
					// update progress bar
					progressBar.style.width = ((this.readyState / 5) * 100) + "%";
				}

				if (this.responseURL.match(/\/login$/)) {
					// redirected to login page
					window.location.href = this.responseURL;
					return;
				}

				if (this.readyState == 4 && this.status == 200) {
					// update progress bar
					progressBar.style.width = "100%";
					// hide progress bar after timeout, to gracefully fade
					currentTimeoutID = window.setTimeout(function () {
						progressBar.style.opacity = "0";
						currentTimeoutID = window.setTimeout(function () {
							progressBar.style.width = "0";
						}, 200);
					}, 300);

					// scroll to top of page
					window.scrollTo(0, 0);

					// push state to history
					currentState = {
						data: this.responseText,
						title: title
					};
					history.pushState(currentState, title, href);
					// update content with xhr text
					document.getElementById("mainArticle").innerHTML = this.responseText;
					document.title = title;
					// ensure nav is closed for mobile
					document.getElementById("mainNav").classList.remove("nav-open");
					document.getElementById("mainArticle").classList.remove("nav-open");

					// clear search
					document.getElementById("searchInput").value = "";
					document.getElementById("searchItems").classList.remove("shown");
					document.getElementById("existingItems").classList.remove("hidden");

					// update expands
					Array.from(document.getElementsByClassName("expand")).forEach(function (item) {
						expandElement(item.parentNode, title);
					});

					// run MathJax
					if (MathJax) {
						MathJax.Hub.Queue(["Typeset",MathJax.Hub,"mainArticle"]);
					}
				} else if (this.readyState == 4 && this.status != 200) {
					// if xhr failed, use normal redirect
					window.location.href = href;
				}
			};

			var stateChangeFirst = function() {
				if (this.readyState == 4 && this.status != 200) {
					// Ugly hack to request partials at end, hugo workaround
					xhr = new XMLHttpRequest();
					xhr.open('GET', pathreplaced2, true);
					xhr.onreadystatechange = stateChange;
					xhr.send();
				} else {
					stateChange.call(this);
				}
			};

			xhr.onreadystatechange = stateChangeFirst;
			xhr.send();
		}
	}
}, false);

window.addEventListener("popstate", function(e) {
	if (e.state && e.state.data) {
		// Don't reload content if already in history
		if (e.state.path != history.state) {
			document.getElementById("mainArticle").innerHTML = e.state.data;
			document.title = e.state.title;

			// ensure nav is closed for mobile
			document.getElementById("mainNav").classList.remove("nav-open");
			document.getElementById("mainArticle").classList.remove("nav-open");

			// clear search
			document.getElementById("searchInput").value = "";
			document.getElementById("searchItems").classList.remove("shown");
			document.getElementById("existingItems").classList.remove("hidden");

			// update expands
			Array.from(document.getElementsByClassName("expand")).forEach(function (item) {
				expandElement(item.parentNode, e.state.title);
			});

			if (MathJax) {
				MathJax.Hub.Queue(["Typeset",MathJax.Hub,"mainArticle"]);
			}
		}
	}
}, false);

window.addEventListener("hashchange", function(e) {
	if (currentState && currentState.title) {
		// Ensure that state exists in history
		history.replaceState(currentState, currentState.title, "");
	} else {
		currentState = { // Save current state
			data: document.getElementById("mainArticle").innerHTML,
			title: document.title
		};
		// Ensure that state exists in history
		history.replaceState(currentState, currentState.title, "");
	}
}, false);
