import { vi } from 'vitest';
import * as THREE from 'three';

export interface WebGLMockControls {
  renderFn: ReturnType<typeof vi.fn>;
  setSizeFn: ReturnType<typeof vi.fn>;
  setPixelRatioFn: ReturnType<typeof vi.fn>;
  disposeFn: ReturnType<typeof vi.fn>;
  mockDomElement: HTMLCanvasElement;
  rendererFactory: (params?: THREE.WebGLRendererParameters) => THREE.WebGLRenderer;
  restore: () => void;
}

export function setupWebGLMock(): WebGLMockControls {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  const mockDomElement = document.createElement('canvas');
  mockDomElement.getBoundingClientRect = () => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => {},
  });

  const renderFn = vi.fn();
  const setSizeFn = vi.fn();
  const setPixelRatioFn = vi.fn();
  const disposeFn = vi.fn();

  class MockWebGLRenderer {
    domElement: HTMLCanvasElement;
    shadowMap = { enabled: false, type: 0 };
    capabilities = {
      isWebGL2: true,
      getMaxAnisotropy: () => 16,
      precision: 'highp',
    };
    info = {
      render: { calls: 0, triangles: 0, points: 0, lines: 0 },
      memory: { geometries: 0, textures: 0 },
    };

    constructor(parameters?: THREE.WebGLRendererParameters) {
      this.domElement = (parameters?.canvas as HTMLCanvasElement) || mockDomElement;
    }

    render(scene: THREE.Object3D, camera: THREE.Camera) {
      renderFn(scene, camera);
    }

    setSize(width: number, height: number, updateStyle?: boolean) {
      setSizeFn(width, height, updateStyle);
    }

    setPixelRatio(pixelRatio: number) {
      setPixelRatioFn(pixelRatio);
    }

    setClearColor() {}
    clear() {}

    dispose() {
      disposeFn();
    }
  }

  const mockContext = {
    getExtension: () => null,
    getParameter: () => 0,
    createShader: () => ({}),
    createProgram: () => ({}),
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    viewport: () => {},
    clearColor: () => {},
    clear: () => {},
    enable: () => {},
    disable: () => {},
    blendFunc: () => {},
  } as unknown as RenderingContext;

  HTMLCanvasElement.prototype.getContext = function (contextId: string, ...args: any[]) {
    if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
      return mockContext as any;
    }
    return (originalGetContext as any).apply(this, [contextId, ...args]);
  };

  (window as any).WebGLRenderingContext = class WebGLRenderingContext {};

  const rendererFactory = (params?: THREE.WebGLRendererParameters) => {
    return new MockWebGLRenderer(params) as unknown as THREE.WebGLRenderer;
  };

  return {
    renderFn,
    setSizeFn,
    setPixelRatioFn,
    disposeFn,
    mockDomElement,
    rendererFactory,
    restore: () => {
      HTMLCanvasElement.prototype.getContext = originalGetContext;
      delete (window as any).WebGLRenderingContext;
    },
  };
}
