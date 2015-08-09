Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj));
};
 
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key));
};
 
var Store = (function () {
    var Store = function (name, cb) {
       cb = cb || function () {};
       this.name = name;
        
       if (!localStorage[name]) {
           var data = [];
           localStorage.setObj(name, data);
       }
       
       cb.call(this, localStorage.getObj(name));
     };
  
     Store.prototype.update = function (data, cb) {
         if (!cb) {
           return;
         }
         
         var exchangeData = localStorage.getObj(this.name);
         var index = _.findIndex(exchangeData, function (obj) {
           return obj.ticker === data.ticker;
         });
         
         if (index > -1) {
           exchangeData[index].volume += data.volume;
         } else {
           exchangeData.push(data);
         }
       
         localStorage.setObj(this.name, exchangeData);
         cb.call(this, exchangeData);
     };
  
     Store.prototype.hasData = function () {
       return localStorage.getObj(this.name);
     };
   
     return Store;
})();
 
var Controller = (function () {
    var Controller = function (model, view) {
    var self = this;
		this.model = model;
		this.view = view;
        
    var exchangeData = this.model.storeHasData();
    var bool = !_.isEmpty(exchangeData);
    if (bool) {
      this.view.render(exchangeData);
    }
		this.view.bind('insertData', function (insertData) {
			self.updateTable(insertData);
		});
    };
  
    Controller.prototype.updateTable = function (insertData) {
      var self = this;
      this.model.update(insertData, function (exchangeData) {
        self.view.render(exchangeData);
      });
    };
  
    return Controller;
})();
 
var Model = (function () {
    var Model = function (storage) {
       this.storage = storage;
    };
  
    Model.prototype.storeHasData = function () {
      return this.storage.hasData();
    };
  
    Model.prototype.update = function (data, cb) {
        cb = cb || function () {};
        this.storage.update(data, cb);
    };
    
    return Model;
})();
 
var View = (function () {
    var View = function (template) {
      this.template = template;
      this.$exchangeTable = $(".exchange-table");
      this.$defaultMessage = $(".default-message");
      this.$ticker = $(".ticker-val");
      this.$volume = $(".volume-val");
      this.$tableContents = $(".table-contents");
      this.$insertData = $(".insert-data");

      this.$defaultMessage.show();
      this.$exchangeTable.hide();
    };
  
    View.prototype.bind = function (event, handler) {
      var self = this;
      if (event === "insertData") {
        this.$insertData.on('click', function () {
          var data;
          data = {};
          data.ticker = self.$ticker.val().toUpperCase();
          data.volume = parseInt(self.$volume.val(), 10);
          
          //User should put in valid data
          if (!_.isEmpty(data.ticker) && !_.isNaN(data.ticker) && !_.isNaN(data.volume)) {
            handler(data);
          } else {
            alert('Uh Oh! Put in valid ticker data');
          }
        });
      }
    };
  
    View.prototype.render = function (data) {
      this.$tableContents.html(this.template.build(data));
      this.$exchangeTable.show();
      this.$defaultMessage.hide();
    };
    
    return View;
})();
 
var Template = (function () {
	var Template = function () {
		this.defaultTemplate =
          '<div class="row">'
        + '<div class="col">{{ticker}}</div>'
        + '<div class="col">{{volume}}</div>'
        + '</div>';
	};
  
    Template.prototype.build = function (data) {
       var totalVolume, view;
       
       totalVolume = 0;
       view = '';
      
       data.forEach(function (obj) {
         var template = this.defaultTemplate;
         var ticker = '';
         var volume = '';
         
         totalVolume += obj.volume;
         template = template.replace('{{ticker}}', obj.ticker);
         template = template.replace('{{volume}}', obj.volume);
         
         view = view + template;
       }, this);
      
       var template = this.defaultTemplate;
       template = template.replace('{{ticker}}', "Total");
       template = template.replace('{{volume}}', totalVolume);
       view = view + template;
      
       return view;
    };
    
    return Template;
})();
 
var App = (function (Store, Model, Template, View, Controller) {
    var App = function (name) {
        this.storage = new Store(name);
        this.model = new Model(this.storage);
        this.template = new Template();
        this.view = new View(this.template);
        this.controller = new Controller(this.model, this.view);
    };
    return App;
})(Store, Model, Template, View, Controller);