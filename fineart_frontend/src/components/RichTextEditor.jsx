'use client';

import { useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '내용을 입력해주세요.',
  readOnly = false,
  onUploadImage,
}) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const initializedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const uploadHandlerRef = useRef(onUploadImage);
  const toolbarRef = useRef(null);
  const skipNextSyncRef = useRef(false);
  const fileInputRef = useRef(null);
  const normalizeImagesRef = useRef(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    uploadHandlerRef.current = onUploadImage;
  }, [onUploadImage]);

  useEffect(() => {
    let mounted = true;
    const container = containerRef.current;

    const init = async () => {
      if (initializedRef.current || !containerRef.current) return;
      initializedRef.current = true;

      const Quill = (await import('quill')).default;
      const normalizeImages = (editorInstance) => {
        if (!editorInstance) return;
        const QuillCtor = editorInstance.constructor;
        if (!QuillCtor?.find) return;
        const images = editorInstance.root.querySelectorAll('img');
        images.forEach((img) => {
          const blot = QuillCtor.find(img);
          if (!blot?.format) return;
          const ml = (img.style.marginLeft || '').trim();
          const mr = (img.style.marginRight || '').trim();
          const fl = (img.style.float || '').trim();
          let align = img.dataset?.align || null;
          if (!align) {
            if ((ml === 'auto' && mr === 'auto') || fl === 'none') align = 'center';
            else if (fl === 'right' || (ml === 'auto' && (mr === '0px' || mr === '0'))) align = 'right';
          }
          if (align) {
            blot.format('align', align);
          }
          if (img.style.width) blot.format('width', img.style.width);
          if (img.style.height) blot.format('height', img.style.height);
        });
      };
      normalizeImagesRef.current = normalizeImages;

      // 이미지를 클릭 후 모서리 드래그로 크기 조절 + 크기/정렬 값 저장
      const Module = Quill.import('core/module');
      const BaseImage = Quill.import('formats/image');
      const AlignStyle = Quill.import('attributors/style/align');
      Quill.register(AlignStyle, true);

      class ImageFormat extends BaseImage {
        static formats(domNode) {
          const detectAlign = () => {
            const ds = domNode.dataset?.align;
            if (ds) return ds;
            const ta = (domNode.style.textAlign || '').trim();
            if (ta === 'center' || ta === 'right' || ta === 'left') return ta;
            const ml = (domNode.style.marginLeft || '').trim();
            const mr = (domNode.style.marginRight || '').trim();
            const fl = (domNode.style.float || '').trim();
            if ((ml === 'auto' && mr === 'auto') || fl === 'none') return 'center';
            if (fl === 'right' || (ml === 'auto' && (mr === '0px' || mr === '0'))) return 'right';
            return null;
          };

          return {
            width: domNode.style.width || null,
            height: domNode.style.height || null,
            align: detectAlign(),
          };
        }

        format(name, value) {
          if (name === 'width' || name === 'height') {
            if (value) {
              this.domNode.style[name] = value;
            } else {
              this.domNode.style[name] = '';
            }
          } else if (name === 'align') {
            if (value) {
              this.domNode.dataset.align = value;
            } else {
              delete this.domNode.dataset.align;
            }
            this.domNode.style.display = 'block';
            this.domNode.style.maxWidth = '100%';
            this.domNode.style.height = this.domNode.style.height || 'auto';
            this.domNode.style.left = '';
            this.domNode.style.clear = 'both';
            this.domNode.style.float = 'none';
            this.domNode.style.marginLeft = '';
            this.domNode.style.marginRight = '';
            this.domNode.style.textAlign = '';
            if (!value) {
              return;
            }
            if (value === 'center') {
              this.domNode.style.marginLeft = 'auto';
              this.domNode.style.marginRight = 'auto';
              this.domNode.style.textAlign = 'center';
            } else if (value === 'right') {
              this.domNode.style.marginLeft = 'auto';
              this.domNode.style.marginRight = '0';
              this.domNode.style.textAlign = 'right';
            } else {
              // left
              this.domNode.style.marginLeft = '0';
              this.domNode.style.marginRight = 'auto';
              this.domNode.style.textAlign = 'left';
            }
          } else {
            super.format(name, value);
          }
        }
      }
      Quill.register(ImageFormat, true);

      class SimpleImageResize extends Module {
        constructor(quill, options) {
          super(quill, options);
          this.quill = quill;
          this.options = {
            preserveAspectRatio: true,
            minSize: 30,
            ...options,
          };
          this.box = null;
          this.img = null;
          this.dragHandle = null;
          this.onDrag = this.onDrag.bind(this);
          this.onDragFinish = this.onDragFinish.bind(this);
          this.sizeLabel = null;

          this.handleClick = this.handleClick.bind(this);
          this.handleScroll = this.handleScroll.bind(this);

          quill.root.addEventListener('click', this.handleClick);
          quill.root.addEventListener('scroll', this.handleScroll);
        }

        handleClick(evt) {
          const target = evt.target;
          if (target && target.tagName === 'IMG') {
            if (this.img === target) return;
            this.show(target);
          } else {
            this.hide();
          }
        }

        handleScroll() {
          if (!this.img) return;
          this.reposition();
        }

        show(img) {
          this.img = img;
          if (!this.box) {
            this.box = document.createElement('span');
            Object.assign(this.box.style, {
              position: 'absolute',
              border: '1px dashed #999',
              boxSizing: 'border-box',
              pointerEvents: 'none',
              display: 'none',
            });
            this.boxHandles = ['nw', 'ne', 'sw', 'se'].map((corner) =>
              this.createHandle(corner),
            );
            this.quill.root.parentNode.style.position = 'relative';
            this.quill.root.parentNode.appendChild(this.box);
          }
          this.box.style.display = 'block';
          this.reposition();
        }

        hide() {
          this.img = null;
          if (this.box) {
            this.box.style.display = 'none';
          }
        }

        createHandle(corner) {
          const handle = document.createElement('span');
          handle.className = `ql-resize-${corner}`;
          Object.assign(handle.style, {
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: '#fff',
            border: '1px solid #666',
            boxSizing: 'border-box',
            cursor: `${corner}-resize`,
            pointerEvents: 'all',
          });
          handle.addEventListener('mousedown', (evt) => this.onDragStart(evt, corner));
          this.box.appendChild(handle);
          return handle;
        }

        onDragStart(evt, corner) {
          evt.preventDefault();
          evt.stopPropagation();
          this.dragHandle = corner;
          this.startX = evt.clientX;
          this.startY = evt.clientY;
          const rect = this.img.getBoundingClientRect();
          this.startWidth = rect.width;
          this.startHeight = rect.height;
          this.aspect = this.startWidth / this.startHeight;

          document.addEventListener('mousemove', this.onDrag);
          document.addEventListener('mouseup', this.onDragFinish);
        }

        onDrag(evt) {
          if (!this.dragHandle || !this.img) return;
          const dx = evt.clientX - this.startX;
          const dy = evt.clientY - this.startY;
          let newWidth = this.startWidth;
          let newHeight = this.startHeight;

          if (this.dragHandle.includes('e')) {
            newWidth = this.startWidth + dx;
          } else if (this.dragHandle.includes('w')) {
            newWidth = this.startWidth - dx;
          }

          if (this.dragHandle.includes('s') || this.dragHandle.includes('n')) {
            if (this.options.preserveAspectRatio) {
              newHeight = newWidth / this.aspect;
            } else if (this.dragHandle.includes('s')) {
              newHeight = this.startHeight + dy;
            } else if (this.dragHandle.includes('n')) {
              newHeight = this.startHeight - dy;
            }
          } else if (this.options.preserveAspectRatio) {
            newHeight = newWidth / this.aspect;
          }

          newWidth = Math.max(this.options.minSize, newWidth);
          newHeight = Math.max(this.options.minSize, newHeight);

          this.img.style.width = `${newWidth}px`;
          this.img.style.height = `${newHeight}px`;
          this.img.style.maxWidth = '100%';
          this.img.style.left = '';

          this.showSizeLabel(newWidth, newHeight);

          const blot = Quill.find(this.img);
          if (blot?.format) {
            blot.format('width', `${newWidth}px`);
            blot.format('height', `${newHeight}px`);
            // keep existing alignment when resizing
            const currentAlign = this.img.dataset.align || null;
            if (currentAlign) {
              blot.format('align', currentAlign);
            }
          }
          this.reposition();
        }

        onDragFinish() {
          document.removeEventListener('mousemove', this.onDrag);
          document.removeEventListener('mouseup', this.onDragFinish);
          this.dragHandle = null;
          this.reposition();
        }

        reposition() {
          if (!this.img || !this.box) return;
          const rect = this.img.getBoundingClientRect();
          const parentRect = this.quill.root.parentNode.getBoundingClientRect();
          Object.assign(this.box.style, {
            display: 'block',
            top: `${rect.top - parentRect.top + this.quill.root.parentNode.scrollTop - 1}px`,
            left: `${rect.left - parentRect.left + this.quill.root.parentNode.scrollLeft - 1}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          });
          const positions = {
            nw: { left: '-7px', top: '-7px' },
            ne: { left: 'calc(100% - 5px)', top: '-7px' },
            sw: { left: '-7px', top: 'calc(100% - 5px)' },
            se: { left: 'calc(100% - 5px)', top: 'calc(100% - 5px)' },
          };
          this.boxHandles.forEach((handle) => {
            const key = handle.className.replace('ql-resize-', '');
            Object.assign(handle.style, positions[key] || {});
          });

          if (this.sizeLabel) {
            this.sizeLabel.style.top = `${rect.top - parentRect.top + this.quill.root.parentNode.scrollTop - 24}px`;
            this.sizeLabel.style.left = `${rect.left - parentRect.left + this.quill.root.parentNode.scrollLeft + rect.width - this.sizeLabel.offsetWidth}px`;
          }
        }

        showSizeLabel(width, height) {
          if (!this.sizeLabel) {
            this.sizeLabel = document.createElement('div');
            Object.assign(this.sizeLabel.style, {
              position: 'absolute',
              padding: '2px 6px',
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '11px',
              pointerEvents: 'none',
              zIndex: '5',
            });
            this.quill.root.parentNode.appendChild(this.sizeLabel);
          }
          this.sizeLabel.textContent = `${Math.round(width)} × ${Math.round(height)}`;
          this.sizeLabel.style.display = 'block';
        }

        hideSizeLabel() {
          if (this.sizeLabel) {
            this.sizeLabel.style.display = 'none';
          }
        }

        destroy() {
          this.quill.root.removeEventListener('click', this.handleClick);
          this.quill.root.removeEventListener('scroll', this.handleScroll);
          this.hide();
          this.hideSizeLabel();
          document.removeEventListener('mousemove', this.onDrag);
          document.removeEventListener('mouseup', this.onDragFinish);
        }
      }

      Quill.register('modules/simpleImageResize', SimpleImageResize);

      if (toolbarRef.current) {
        toolbarRef.current.remove();
        toolbarRef.current = null;
      }

      containerRef.current.innerHTML = '';
      quillRef.current = new Quill(containerRef.current, {
        theme: 'snow',
        readOnly,
        placeholder,
        modules: {
          toolbar: {
            container: [
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ align: '' }, { align: 'center' }, { align: 'right' }],
              ['link', 'blockquote', 'image'],
              ['clean'],
            ],
          },
          simpleImageResize: {
            preserveAspectRatio: true,
            minSize: 30,
          },
        },
      });

      const editor = quillRef.current;
      if (value) {
        editor.clipboard.dangerouslyPasteHTML(value);
        normalizeImagesRef.current?.(editor);
      }

      editor.on('text-change', () => {
        if (!mounted) return;
        const html = editor.root.innerHTML;
        skipNextSyncRef.current = true;
        onChangeRef.current?.(html === '<p><br></p>' ? '' : html);
      });

      editor.on('selection-change', (range) => {
        const resize = editor.getModule('simpleImageResize');
        if (!range) {
          resize?.hide?.();
          return;
        }
        const [blot] = editor.getLeaf(range.index);
        const node = blot?.domNode ?? blot?.parent?.domNode;
        if (node?.tagName === 'IMG') {
          resize?.show?.(node);
        } else {
          resize?.hide?.();
        }
      });

      const maybeToolbar = containerRef.current.previousSibling;
      if (maybeToolbar && maybeToolbar.classList?.contains('ql-toolbar')) {
        toolbarRef.current = maybeToolbar;
      }

      const toolbar = editor.getModule('toolbar');
      if (toolbar) {
        const resizeModule = editor.getModule('simpleImageResize');
        const applyAlign = (value) => {
          const range = editor.getSelection(true);
          if (!range) return;
          const [blot] = editor.getLeaf(range.index);
          const target = blot?.domNode ?? blot?.parent?.domNode;
          if (target?.tagName === 'IMG') {
            const imageBlot = Quill.find(target);
            resizeModule?.hide?.();
            imageBlot?.format?.('align', value || '');
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (imageBlot?.domNode) {
                  resizeModule?.show?.(imageBlot.domNode);
                  normalizeImagesRef.current?.(editor);
                }
              });
            });
          } else {
            editor.format('align', value || '');
          }
        };

        toolbar.addHandler('image', () => {
          if (readOnly) return;
          if (uploadHandlerRef.current && fileInputRef.current) {
            fileInputRef.current.click();
            return;
          }
          const url = window.prompt('이미지 URL을 입력해주세요');
          if (url) {
            const range = editor.getSelection(true);
            const index = range?.index ?? editor.getLength();
            editor.insertEmbed(index, 'image', url, 'user');
            editor.setSelection(index + 1);
          }
        });

        toolbar.addHandler('align', (value) => applyAlign(value));
      }
    };

    init();
    return () => {
      mounted = false;
      if (quillRef.current) {
        quillRef.current.off('text-change');
      }
      quillRef.current = null;
      if (container) {
        container.innerHTML = '';
      }
      if (toolbarRef.current) {
        toolbarRef.current.remove();
        toolbarRef.current = null;
      }
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder, readOnly]);

  useEffect(() => {
    const editor = quillRef.current;
    if (!editor) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const current = editor.root.innerHTML;
    const normalizedCurrent = current === '<p><br></p>' ? '' : current;
    const normalizedValue = value ?? '';
    if (normalizedValue !== normalizedCurrent) {
      editor.clipboard.dangerouslyPasteHTML(normalizedValue);
      normalizeImagesRef.current?.(editor);
    }
  }, [value]);

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !uploadHandlerRef.current || !quillRef.current) return;
    try {
      const url = await uploadHandlerRef.current(file);
      if (!url) return;
      const editor = quillRef.current;
      const range = editor.getSelection(true);
      const index = range?.index ?? editor.getLength();
      editor.insertEmbed(index, 'image', url, 'user');
      editor.setSelection(index + 1);
    } catch (error) {
      console.error('[RichTextEditor] Failed to upload image:', error);
    }
  };

  return (
    <>
      <div ref={containerRef} className="min-h-[300px]" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
