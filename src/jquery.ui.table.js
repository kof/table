/*
 * jQuery UI Table @VERSION
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/table
 *
 * Depends:
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 */
(function( $ ) {

var prefix = "ui-table",
    baseClasses = "ui-table ui-widget ui-widget-content";

var headTemplate = '\
    <table class="<%=prefix%>-head-table" cellspacing="0" cellpadding="0" border="1" width="100%" height="100%">\
        <thead>\
            <tr>\
                <% for ( var i=0; i<columns.length; ++i) { %>\
                    <th>\
                        <div class="<%=prefix%>-cell-content">\
                            <span class="<%=prefix%>-sort-icon"></span>\
                            <span class="<%=prefix%>-header">\
                                <%=columns[i].header%>\
                            </span>\
                        </div>\
                    </th>\
                <% } %>\
            </tr>\
        </thead>\
    </table>\
';

var bodyTemplate = '\
    <table class="<%=prefix%>-body-table" cellspacing="0" cellpadding="0" border="1" width="100%" height="100%">\
        <tbody>\
            <% for ( var i=0; i<data.length; ++i) { %>\
            <tr>\
                <% for ( var cell in data[i] ) { %>\
                <td>\
                    <div class="<%=prefix%>-cell-content">\
                        <%=data[i][cell]%>\
                    </div>\
                </td>\
                <% } %>\
            </tr>\
            <% } %>\
        </tbody>\
    </table>\
';

$.widget( "ui.table", {
    version: "@VERSION",
    options: {
        columns: null,
        data: null,
        templates: {
            head: headTemplate,
            body: bodyTemplate
        }, 
        width: "100%",
        height: "auto",
        type: "text",
        speed: 300
    },
 
    _create: function() {
        var o = this.options;
        
        if ( !o.columns || !o.data ) 
            return;
            
        this.originalHtml = this.element.html();
        
        this.head = $("<div class='" + prefix + "-head'></div>").appendTo(this.element);
        this.body = $("<div class='" + prefix + "-body'></div>").appendTo(this.element);
        
        this.element
            .addClass( baseClasses )
            .attr("role", "table")
            .css({
                width: o.width,
                height: o.height
            });
        
        var headHtml = tmpl(o.templates.head, {
            columns: o.columns,
            prefix: prefix
        });    
        // don't use .html to get more performance       
        this.head.each(function(){
            this.innerHTML = headHtml;    
        });
        this.headHeight = this.head.outerHeight();
        
        this._updateBody(o.data);
        this._defColsWidth();
        this._setBodyHeight();
        
    },
    
    destroy: function() {
        this.element
            .removeClass( baseClasses )
            .removeAttr( "role" )
            .html(this.originalHtml);
        $.Widget.prototype.destroy.apply( this, arguments );
    },
         
    update: function( data ) {
        this._updateBody(data);
        this._defColsWidth();
        this._setOption( "data", data );
    },
    
    scrollTo: function( nr, speed, easing, callback ) {
        var o = this.options;
        this.body.each(function(){
            var offsetTop = $("tr:eq(" + nr + ")", this)[0].offsetTop;
            $(this).animate({scrollTop: offsetTop }, speed || o.speed, easing, callback);    
        });        
    },
    
    _updateBody: function( data ) {
        var bodyHtml = tmpl(this.options.templates.body, {
            data: data,
            prefix: prefix
        }); 
        // don't use .html to get more performance       
        this.body.each(function() {
            this.innerHTML = bodyHtml;
        });                
    },     
           
    _setBodyHeight: function() {
        this.body.css("height", this.options.height - this.headHeight);    
    },
    
    // we have to apply the cols width to ths elements, since it is an extra table
    _defColsWidth: function() {
        var o = this.options,
            ths = this.head.find("." + prefix + "-cell-content"),
            tds = this.body.find("tr:first ." + prefix + "-cell-content"),
            width;
        
        // browser will auto calc last column width
        for ( var i=0, data; i < o.columns.length-1; ++i) {
            data = o.columns[i];
            width = data.width;
            // only detect width if not set
            if ( !width ) {
                width = tds.eq(i).width();
            }    
            // td width can't be smaller then th width
            var thWidth = ths.eq(i).width();
            
            if (thWidth > width) {
                width = thWidth;
            }
            
            tds.eq(i).parent().add(ths.eq(i).parent()).css("width", width);
            
        }
    }

});


/*
 * micro templating engine
 * can be replaced with new template engine from the core
 */
var cache = {};
function tmpl(str, data) {
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +
       
        "with(obj){p.push('" +
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");
    return data ? fn( data ) : fn;
}

})( jQuery );
