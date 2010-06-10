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
    baseClasses = "ui-table ui-widget ui-widget-content ui-corner-all";

var headTemplate = '\
    <table class="<%=prefix%>-head-table" cellspacing="0" cellpadding="0" border="0" width="100%" height="100%">\
        <thead>\
            <tr>\
                <% for ( var i=0; i<columns.length; ++i) { %>\
                    <th>\
                        <div class="<%=prefix%>-cell-inner">\
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
    <table class="<%=prefix%>-body-table" cellspacing="0" cellpadding="0" border="0" width="100%" height="100%">\
        <tbody>\
            <% for ( var i=0; i<data.length; ++i) { %>\
            <tr>\
                <% for ( var cell in data[i] ) { %>\
                <td>\
                    <div class="<%=prefix%>-cell-inner">\
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
        
        // don't use .html to get more performance       
        this.head[0].innerHTML = tmpl(o.templates.head, {
            columns: o.columns,
            prefix: prefix
        });
        this.headHeight = this.head.outerHeight();

        this._updateBody();
        this.bodyTable = this.body.children("table");
        this._defColsWidth();
        this._setBodyHeight();
        this.bodyTableHeight = this.bodyTable.height();
        this.scrollBar = this.bodyHeight < this.bodyTableHeight;
        this.scrollBar && this.head.css( "marginRight", scrollbarWidth() );      
   },
    
    destroy: function() {
        this.element
            .removeClass( baseClasses )
            .removeAttr( "role" )
            .html(this.originalHtml);
            
        $.Widget.prototype.destroy.apply( this, arguments );
    },
         
    _setOption: function( key, value ) {
        switch ( key ) {
            case "data":
                this.options.data = value;
                this._updateBody();
                this._defColsWidth();
                this._trigger( "datachange", null, this._ui() );
                break;
        }

        $.Widget.prototype._setOption.apply( this, arguments );
    },          
    
    scrollToRow: function( nr, speed, easing, callback ) {
        if ( nr < 0 ) {
            nr = 0;
        } else if ( nr > this.options.data.length-1 ) {
            nr = this.options.data.length-1;
        }

        var offsetTop = $("tr:eq(" + nr + ")", this.body)[0].offsetTop;
        this.body.animate({scrollTop: offsetTop }, speed || this.options.speed, easing, callback);
    },
    
    _updateBody: function() {
        // don't use .html to get more performance       
        this.body[0].innerHTML = tmpl(this.options.templates.body, {
            data: this.options.data,
            prefix: prefix
        });
    },     
           
    _setBodyHeight: function() {
        this.bodyHeight = this.options.height - this.headHeight;
        this.body.css("height", this.bodyHeight);    
    },
    
    // we have to apply the cols width to ths elements, since it is an extra table
    _defColsWidth: function() {
        var o = this.options,
            ths = this.head.find("th"),
            tds = this.body.find("tr:first td"),
            th, td,
            width, thWidth,
            i = 0;
            
        // browser will auto calc last column width
        for ( ; i < o.columns.length; ++i ) {
            width = o.columns[i].width;
            if ( width ) {
                th = ths.eq(i);
                td = tds.eq(i);
                td.add(th).css( "width", width ); 
            }

        }
    },
    
    _ui: function() {
        return {
            data: this.options.data,
            columns: this.options.columns
        }
    }

});

/*
 * Detect system scrollbar width
 * this should be an extra widget or plugin
 */
var scrollbarWidth = (function(){
    var width;
    function scrollbarWidth() {
        if ( width ) 
            return width;
        
        var $parent = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"/>').appendTo('body'),
            $child = $('<div style="height:100%;"/>').appendTo($parent),
            realWidth = $child.innerWidth();
            
        $parent.css('overflow', 'scroll');
        
        width = realWidth - $child.innerWidth();    
        $parent.remove();
        return width;
    }   
    return scrollbarWidth; 
})();


/*
 * micro templating engine
 * can be replaced with new template engine from the core
 */
var tmpl = (function(){
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
    return tmpl;    
})();


})( jQuery );
