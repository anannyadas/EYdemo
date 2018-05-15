angular.module("crmApp", ["ngRoute", "ngAnimate", "underscore"])

    .config(['$routeProvider', function ($routeProvider) { // we set our client routing

        var authDep = ['$q', 'authenticationService', function ($q, authenticationService) {
            var userInfo = authenticationService.getUserInfo();
            if (userInfo) {
                return $q.when(userInfo);
            } else {
                return $q.reject({authenticated: false});
            }
        }];

        $routeProvider.when("/", {
            templateUrl: "view/customers-list.html",
            controller: "ListController",
            resolve: {
                auth: authDep
            }
        }).when("/customer-detail/:customerId", {
            templateUrl: "view/customer-detail.html",
            controller: "DetailController",
            resolve: {
                auth: authDep
            }
        }).when("/about", {
            templateUrl: "view/about.html"
        }).when("/login", {
            templateUrl: "view/login.html",
            controller: "LoginController"
        }).otherwise({
            redirectTo: "/"
        });
    }])

    .run(["$rootScope", "$location", function ($rootScope, $location) {

        $rootScope.$on("$routeChangeSuccess", function (userInfo) {
            console.log(userInfo);
        });

        $rootScope.$on("$routeChangeError", function (event, current, previous, eventObj) {
            if (eventObj.authenticated === false) {
                $location.path("/login");
            }
        });
    }])

    .controller("ListController", ['$rootScope', '$scope', 'customerService', 'auth', function ($rootScope, $scope, customerService, auth) {

        $rootScope.userInfo = auth;

        // initialization for sortable table
        $scope.sortColumn = 'name';
        $scope.sortReverse = false;
        $scope.searchName = '';

        customerService.getCustomers().then(function(response) {
            $scope.customers = response.data;
        });

        $scope.save = function () {

            customerService.add({
                name: $scope.newCustomer.name,
                info: $scope.newCustomer.info,
                email: $scope.newCustomer.email,
                status: $scope.newCustomer.status,
                cbrank: $scope.newCustomer.cbrank
            }).then(function(response) {
                $scope.customers = response.data;
            });

        };

        $scope.delete = function (customerId) {

            customerService.delete(customerId).then(function(response) {
                $scope.customers = response.data;
            });

        };

    }])

    .controller("DetailController", ['$rootScope', '$scope', 'customerService', '$routeParams', 'auth', function ($rootScope, $scope, customerService, $routeParams, auth) {

        $rootScope.userInfo = auth;

        customerService.get($routeParams.customerId).then(function(response) {
            $scope.customer = response.data;
        });

        $scope.update = function () {

            customerService.update($scope.customer);

        }

    }])

    .controller("NavbarController", ['$rootScope', '$scope', '$location', 'authenticationService', function ($rootScope, $scope, $location, authenticationService) {

        $scope.logout = function () {

            authenticationService.logout()
                .then(function (result) {
                    $rootScope.userInfo = null;
                    $location.path("/login");
                }, function (error) {
                    console.log(error);
                });
        };

    }])

    .controller("LoginController", ["$rootScope", "$scope", "$location", "$window", "authenticationService", function ($rootScope, $scope, $location, $window, authenticationService) {
        $rootScope.userInfo = null;
        $scope.login = function () {
            authenticationService.login($scope.userName, $scope.password)
                .then(function (result) {
                    $rootScope.userInfo = result;
                    $location.path("/");
                }, function (error) {
                    $window.alert("Invalid credentials");
                    console.log(error);
                });
        };

        $scope.cancel = function () {
            $scope.userName = "";
            $scope.password = "";
        };
    }])

    .factory("customerService", ['$http', '$rootScope', function ($http, $rootScope) {

        return {

            getCustomers: function () {

                return $http.get("/api/crm", {headers: {"access_token" : function(config) { return $rootScope.userInfo.accessToken}}});

            },

            get: function (customerId) {

                return $http.get("/api/crm/" + customerId, {headers: {"access_token" : function(config) { return $rootScope.userInfo.accessToken}}});

            },

            add: function (newCustomer) {

                return $http.post("/api/crm", newCustomer, {headers: {"access_token" : function(config) { return $rootScope.userInfo.accessToken}}});

            },

            update: function (customer) {

                return $http.put("/api/crm", customer, {headers: {"access_token" : function(config) { return $rootScope.userInfo.accessToken}}});

            },

            delete: function (customerId) {

                return $http.delete("/api/crm/" + customerId, {headers: {"access_token" : function(config) { return $rootScope.userInfo.accessToken}}});

            }

        }

    }])

    .factory("authenticationService", ["$http", "$q", "$window", function ($http, $q, $window) {
        var userInfo;

        function login(userName, password) {
            var deferred = $q.defer();

            $http.post("/api/login", {userName: userName, password: password})
                .then(function (result) {
                    userInfo = {
                        accessToken: result.data.access_token,
                        userName: result.data.userName
                    };
                    $window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
                    deferred.resolve(userInfo);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function logout() {
            var deferred = $q.defer();

            $http({
                method: "POST",
                url: "/api/logout",
                headers: {
                    "access_token": userInfo.accessToken
                }
            }).then(function (result) {
                userInfo = null;
                $window.sessionStorage["userInfo"] = null;
                deferred.resolve(result);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        function getUserInfo() {
            return userInfo;
        }

        function init() {
            if ($window.sessionStorage["userInfo"]) {
                userInfo = JSON.parse($window.sessionStorage["userInfo"]);
            }
        }

        init();

        return {
            login: login,
            logout: logout,
            getUserInfo: getUserInfo
        };
    }]);
