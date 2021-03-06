// Author: Rok Garbas
// Contact: rok@garbas.si
// Version: 1.0
//
// Description:
//    plone.toolbar.js script makes sure that all dropdowns in Plone's toolbar
//    are in sync with iframe's stretching/schrinking.
//
// License:
//
// Copyright (C) 2010 Plone Foundation
//
// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation; either version 2 of the License.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along with
// this program; if not, write to the Free Software Foundation, Inc., 51
// Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
//

/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true,
  newcap:true, noarg:true, noempty:true, nonew:true, plusplus:true,
  undef:true, strict:true, trailing:true, browser:true, evil:true */
/*global define:false */

if (window.jQuery) {
  define( "jquery", [], function () {
    "use strict";
    return window.jQuery;
  } );
}

define([
  'jquery',
  'js/jquery.iframe',
  'jam/Patterns/src/registry',
  'js/patterns/toggle',
  'js/patterns/modal',
  'js/patterns/tinymce',
  'js/bundles/widgets'
], function($, iframe, registry, Toggle, Modal, TinyMCE) {
  "use strict";

  $(document).ready(function() {

    // Dropdown {{{

    // toggle class on click (shows dropdown)
    $('.toolbar-dropdown > a').each(function() {
      new Toggle($(this), {
        target: '.toolbar-dropdown',
        value: 'toolbar-dropdown-open'
      });
    });

    // at opening toolbar dropdown:
    // - close all other opened dropdown buttons
    // - stretch iframe
    // at closing dropdown shrink iframe
    $(document)
      .on('add-attr.toggle.patterns', '.toolbar-dropdown > a', function(e) {
        var $el = $(this);
        $('.toolbar-dropdown-open > a').each(function() {
          if ($el[0] !== $(this)[0]) {
            $(this).trigger('click');
          }
        });
        iframe.stretch();
      })
      .on('removed-attr.toggle.patterns', '.toolbar-dropdown > a', function(e) {
        iframe.shrink();
      });

    // }}}

    // Modals Helpers {{{

    // make sure we close all dropdowns when iframe is shrinking
    iframe.$el.on('shrink.iframe', function(e) {
      $('.toolbar-dropdown-open > a').each(function() {
        $(this).trigger('click');
      });
    });

    // integration of toolbar and modals
    $(document)
      .on('before-ajax.modal.patterns', 'a.modal-trigger', function(e) {
        var $el = $(this);
        $('.toolbar-dropdown-open > a').each(function() {
          if ($el[0] !== $(this)[0]) {
            $(this).trigger('click');
          }
        });
        $('body', iframe.document).css('overflow', 'hidden');
        iframe.stretch();
      })
      .on('show.modal.patterns', 'a.modal-trigger', function(e, modal) {
        var $el = $(this);
        $('.toolbar-dropdown-open > a').each(function() {
          if ($el[0] !== $(this)[0]) {
            $(this).trigger('click');
          }
        });
        $('body', iframe.document).css('overflow', 'hidden');
        iframe.stretch();
      })
      .on('hidden.modal.patterns', 'a.modal-trigger', function(e) {
        $('body', iframe.document).css('overflow', 'visible');
        iframe.shrink();
      });

    // }}}

    // Modals {{{


    // Contents
    function refreshModal(modal, responseBody, state, xhr, form) {
      modal.$modal.html(responseBody.html());
      modalInit(modal, modalInit, modalOptions);
      modal.positionModal();
      registry.scan(modal.$modal);
    }
    $('#plone-action-folderContents > a').addClass('modal-trigger').patternModal({
      width: '80%',
      templateOptions: {
        buttons: '#folderlisting-main-table > input.context,#folderlisting-main-table > input.standalone,.modal-body .formControls > input',
        actions: {
          '.modal-body a#foldercontents-show-batched': { onSuccess: refreshModal },
          '.modal-body a#foldercontents-show-all': { onSuccess: refreshModal },
          '.modal-body .pagination a': { onSuccess: refreshModal },
          '.modal-body #folderlisting-main-table > input.standalone': { onSuccess: refreshModal },
          '.modal-body #folderlisting-main-table > input.context': { onSuccess: refreshModal },
          '.modal-body .formControls > input.standalone': { onSuccess: refreshModal },
          '.modal-body .formControls > input.context': { onSuccess: refreshModal },
          '.modal-body a#foldercontents-selectall-completebatch': { onSuccess: refreshModal },
          '.modal-body a#foldercontents-selectall': { onSuccess: refreshModal },
          '.modal-body a#foldercontents-clearselection': { onSuccess: refreshModal },
          '.modal-body #folderlisting-main-table td:not(.draggable) > a.contenttype-folder': { onSuccess: refreshModal },
          '.modal-body .link-parent': { onSuccess: refreshModal },
          '.modal-body td.draggable > a': { onSuccess: refreshModal }
        }
      },
    }).on('show.modal.patterns', function(e, modal) {
      $('#plone-document-byline', modal.$modal).hide();  // TODO: not sure exectly how to handle this for now we hide it
      $('.modal-footer input.context', modal.$modal).removeClass('context').addClass('standalone');
      $('.listingBar', modal.$modal).each(function() {  // TODO: we shouldn't hack like this
        var $el = $(this),
            $pagination = $('<ul/>'),
            $previous, $next;

        // create boostrap style pagination
        $('> *', $el).each(function() {
          if ($(this).hasClass('previous')) {
            $previous = $('<li/>').append($('a', this).clone());
          } else if ($(this).hasClass('next')) {
            $next = $('<li/>').append($('a', this).clone());
          } else if ($.nodeName(this, 'span')) {
            if ($('a', this).size() !== 0) {
              $pagination.append($('<li/>').append($('a', this).clone()));
              if ($(this).html().indexOf("...") !== -1) {
                $pagination.append($('<li class="deactive"><span>...</span></li>'));
              }
            } else {
              $pagination.append($('<li class="active"/>').append($(this).clone()));
            }
          } else {
            $pagination.append($('<li/>').append($(this).clone()));
          }
        });
        if ($previous) {
          $pagination.prepend($previous);
        }
        if ($next) {
          $pagination.append($next);
        }
        $el.hide().before($('<div class="pagination pagination-centered"/>').append($pagination));
      });
      $('.modal-body #folderlisting-main-table td:not(.draggable) > a:not(.contenttype-folder)', modal.$modal).css({
        color: '#333333'
      }).on('click', function(e) {
        window.parent.location.href = $(this).attr('href');
      });
    });

//    // Edit
//    Modal.prepareModal('#plone-action-edit > a', function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal, {
//        buttons: 'input[name="form.buttons.save"],input[name="form.buttons.cancel"],input[name="form.button.save"],input[name="form.button.cancel"]'
//      });
//      $('span.label', modal.$modal).removeClass('label');
//      $('.mce_editable', modal.$modal).addClass('pat-plone-tinymce');
//      Modal.createAjaxForm(modal, modalInit, modalOptions, {
//        buttons: {
//          '.modal-body input[name="form.buttons.cancel"],.modal-body input[name="form.button.cancel"]': {},
//          '.modal-body input[name="form.buttons.save"],.modal-body input[name="form.button.save"]': {
//            onSuccess: function(modal, responseBody, state, xhr, form) {
//              $('#portal-column-content', window.parent.document).html(
//                  $('#portal-column-content', responseBody).html());
//              modal.hide();
//            }
//          }
//        }
//      });
//    }, { width: '80%' });
//
//    // Sharing
//    Modal.prepareModal('#plone-action-local_roles > a', function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal, {
//        buttons: 'input[name="form.button.Save"],input[name="form.button.Cancel"]'
//      });
//      // FIXME: we shouldn't be hacking like this
//      $('#link-presentation', modal.$modal).remove();
//      Modal.createAjaxForm(modal, modalInit, modalOptions, {
//        buttons: {
//          '.modal-body input[name="form.button.Cancel"]': {},
//          '.modal-body input[name="form.button.Save"]': {},
//          '.modal-body input[name="form.button.Search"], dl.portalMessage.info > dd > a': {
//            onSuccess: function(modal, responseBody, state, xhr, form) {
//              modal.$modal.html(responseBody.html());
//              modalInit(modal, modalInit, modalOptions);
//              modal.positionModal();
//              registry.scan(modal.$modal);
//            }
//          }
//        }
//      });
//
//    });
//
//    // Rules form
//    Modal.prepareModal('#plone-action-contentrules > a', function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal, {
//        buttons: 'input[name="form.button.AddAssignment"],' +
//                 'input[name="form.button.Enable"],' +
//                 'input[name="form.button.Disable"],' +
//                 'input[name="form.button.Bubble"],' +
//                 'input[name="form.button.NoBubble"],' +
//                 'input[name="form.button.Delete"]'
//      });
//      $('.modal-body #content-core > p:first > a', modal.$modal).on('click', function(e) {
//        window.parent.location.href = $(this).attr('href');
//      });
//      Modal.createTemplate(modal, modalInit, modalOptions, {
//        buttons: {
//          'input[name="form.button.AddAssignment"],input[name="form.button.Enable"],input[name="form.button.Disable"],input[name="form.button.Bubble"],input[name="form.button.NoBubble"],input[name="form.button.Delete"]': {
//            onSuccess: function(modal, responseBody, state, xhr, form) {
//              modal.$modal.html(responseBody.html());
//              modalInit(modal, modalInit, modalOptions);
//              modal.positionModal();
//              registry.scan(modal.$modal);
//            }
//          }
//        }
//      });
//    });
//
//    // Delete Action
//    Modal.prepareModal('#plone-contentmenu-actions-delete > a', function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal, {
//        buttons: 'input[name="form.button.Cancel"],input.destructive'
//      });
//      Modal.createAjaxForm(modal, modalInit, modalOptions, {
//        buttons: {
//          '.modal-body input[name="form.button.Cancel"]': {},
//          '.modal-body input.destructive': {
//            onSuccess: function(modal, responseBody, state, xhr, form) {
//              window.parent.location.href = $($(xhr.responseText).filter('base')[0]).attr('href');
//            }
//          }
//        }
//      });
//    });
//
//    // Rename Action
//    Modal.prepareModal('#plone-contentmenu-actions-rename > a', function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal, {
//        buttons: 'input[name="form.button.Cancel"],input[name="form.button.RenameAll"]'
//      });
//      Modal.createAjaxForm(modal, modalInit, modalOptions, {
//        buttons: {
//          '.modal-body input[name="form.button.Cancel"]': {},
//          '.modal-body input[name="form.button.RenameAll"]': {
//            onSuccess: function(modal, responseBody, state, xhr, form) {
//              window.parent.location.href = $($(xhr.responseText).filter('base')[0]).attr('href') + '/' + $('input[name="new_ids:list"]', form).val();
//            }
//          }
//        }
//      });
//    });
//
//    // Change content item as default view...
//    var changeContentItemAsDefaultView = function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal);
//      // FIXME: we should hack like this
//      $('form > dl', modal.$modal).addClass('default-page-listing');
//      $('input[name="form.button.Cancel"]', modal.$modal).attr('class', 'standalone');
//      Modal.createAjaxForm(modal, modalInit, modalOptions, {
//        buttons: {
//          '.modal-body input[name="form.button.Cancel"]': {},
//          '.modal-body input[name="form.button.Save"]': {
//            onSuccess: function(modal, responseBody, state, xhr) {
//              window.parent.location.href = window.parent.location.href;
//            }
//          }
//        }
//      });
//    };
//    Modal.prepareModal('#folderChangeDefaultPage > a', changeContentItemAsDefaultView);
//    Modal.prepareModal('#contextSetDefaultPage > a', changeContentItemAsDefaultView);
//
//    // Add forms
//    Modal.prepareModal('#plone-contentmenu-factories > ul > li > a', function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal, {
//        buttons: 'input[name="form.buttons.save"],input[name="form.buttons.cancel"],input[name="form.button.save"],input[name="form.button.cancel"]'
//      });
//      $('span.label', modal.$modal).removeClass('label');
//      $('.mce_editable', modal.$modal).addClass('pat-plone-tinymce');
//      Modal.createAjaxForm(modal, modalInit, modalOptions, {
//        buttons: {
//          '.modal-body input[name="form.buttons.cancel"],.modal-body input[name="form.button.cancel"]': {},
//          '.modal-body input[name="form.buttons.save"],.modal-body input[name="form.button.save"]': {
//            onSuccess: function(modal, responseBody, state, xhr, form) {
//              $('#portal-column-content', window.parent.document).html(
//                  $('#portal-column-content', responseBody).html());
//              window.parent.location.href = $($(xhr.responseText).filter('base')[0]).attr('href');
//            }
//          }
//        }
//      });
//    }, { width: '80%' });
//
//    // "Restrictions..." form
//    Modal.prepareModal('#plone-contentmenu-settings > a', function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal);
//      // FIXME: we should hack like this
//      var $details = $('#details', modal.$modal)
//        .removeAttr('style')
//        .removeAttr('id')
//        .first().parent();
//
//      function show_submenu($modal) {
//        if ($('#mode_enable', $modal).is(':checked')) {
//          $details.attr({'id': 'details', 'style': ''});
//        } else {
//          $details.attr({'id': 'details', 'style': 'display:none;'});
//        }
//      }
//      function check_mode($modal, value) {
//        // The logic here is that from #6151, comment 12.
//        var $preferred = $('#' + value, $modal),
//            $allowed = $('#' + value + '_allowed', $modal),
//            $allowed_hidden = $('#' + value + '_allowed_hidden', $modal);
//
//        // type is not preferred, so it is not allowed, too.
//        // We uncheck and disable (ghost) the allowed checkbox
//        if (!$preferred.is(':checked')) {
//          $allowed.attr('checked', false);
//          $allowed.attr('disabled', true);
//
//        // type _is_ preferred, so user _may_ want to make it
//        // an "allowed-only" type by checking the "allowed" checkbox.
//        // We need to enable (unghost) the allowed checkbox
//        } else {
//          $allowed.attr('disabled', false);
//        }
//      }
//
//      $('input[name="constrainTypesMode:int"]', modal.$modal)
//        .removeAttr('onclick')
//        .on('click', function() {
//          show_submenu($(this).parents('.modal'));
//        });
//      $('input[name="currentPrefer:list"],input[name="currentAllow:list"]', modal.$modal)
//        .removeAttr('onclick')
//        .on('click', function() {
//          check_mode($(this).parents('.modal'), $(this).attr('id'));
//        });
//      show_submenu(modal.$modal);
//
//      Modal.createAjaxForm(modal, modalInit, modalOptions, {
//        buttons: {
//          '.modal-body input[name="form.button.Cancel"]': {},
//          '.modal-body input[name="form.button.Save"]': {
//            onSuccess: function(modal, responseBody, state, xhr) {
//              $('#plone-contentmenu-factories').html(
//                  $('#plone-contentmenu-factories', responseBody).html());
//              modal.hide();
//            }
//          }
//        }
//      });
//    });
//
//    // Advance workflow
//    Modal.prepareModal('#workflow-transition-advanced > a', function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal, {
//        buttons: 'input[name="form.button.Cancel"],input[name="form.button.FolderPublish"],input[name="form.button.Publish"]'
//      });
//
//      // FIXME: we should _not_ hack like this
//      $('#workflow_action', modal.$modal).parent().find('> br').remove();
//
//      Modal.createAjaxForm(modal, modalInit, modalOptions, {
//        buttons: {
//          '.modal-body input[name="form.button.Cancel"]': {},
//          '.modal-body input[name="form.button.Publish"], .modal-body input[name="form.button.FolderPublish"]': {
//            onSuccess: function(modal, responseBody, state, xhr) {
//              $('#plone-contentmenu-workflow')
//                .html($('#plone-contentmenu-workflow', responseBody).html());
//              $('#plone-contentmenu-workflow > a').toggle({
//                target: '.toolbar-dropdown',
//                value: 'toolbar-dropdown-open'
//              });
//              $('#plone-contentmenu-workflow #workflow-transition-advanced > a')
//                  .addClass('modal-trigger').modal();
//              $('body', iframe.document).css('overflow', 'visible');
//              modal.hide();
//            }
//          }
//        }
//      });
//    });
//
//    // personal preferences
//    Modal.prepareModal('#plone-personal-actions-preferences > a', function(modal, modalInit, modalOptions) {
//      Modal.createTemplate(modal.$modal, {
//        buttons: 'input[name="form.actions.save"],input[name="form.actions.cancel"]'
//      });
//      $('select[name="form.wysiwyg_editor"], select[name="form.language"]', modal.$modal).addClass('pat-select2');
//      $('input[name="form.actions.cancel"]', modal.$modal).attr('class', 'standalone');
//      Modal.createAjaxForm(modal, modalInit, modalOptions, {
//        buttons: {
//          '.modal-body input[name="form.actions.cancel"]': {},
//          '.modal-body input[name="form.actions.save"]': {}
//        }
//      });
//    }, { width: '80%' });
//
//    // }}}
//
  });

  return {
    scan: function(selector) {
      registry.scan($(selector));
    }
  };

});
