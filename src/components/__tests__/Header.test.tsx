import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import { useShowStore } from '../../store/useShowStore';
import { createDefaultShow } from '../../types/stage';

describe('Header Component — Unified Command Header (Đợt 14.3 / R3)', () => {
  beforeEach(() => {
    const show = createDefaultShow('Concert Arena Gala');
    useShowStore.getState().loadShow(show);
  });

  it('renders Command Bar (52px) and Workspace Strip (36px) with correct layout zones', () => {
    render(
      <Header
        viewMode="split"
        setViewMode={vi.fn()}
        isOperatorLocked={false}
        setIsOperatorLocked={vi.fn()}
        onOpenProject={vi.fn()}
        onImportClick={vi.fn()}
        onExportClick={vi.fn()}
        onHelpClick={vi.fn()}
        wallClock="19:30:00"
      />
    );

    // Strip 1: Command Bar exact 52px
    const commandBar = screen.getByTestId('header-command-bar');
    expect(commandBar).toBeInTheDocument();
    expect(commandBar.className).toContain('h-[52px]');

    // Strip 2: Workspace Strip exact 36px
    const workspaceStrip = screen.getByTestId('header-workspace-strip');
    expect(workspaceStrip).toBeInTheDocument();
    expect(workspaceStrip.className).toContain('h-[36px]');

    // Command Bar Left Zone: Brand, Title, Clocks, Hardware badges
    expect(screen.getByText('Light Stage')).toBeInTheDocument();
    expect(screen.getByText('Concert Arena Gala')).toBeInTheDocument();
    expect(screen.getByText('Show Time')).toBeInTheDocument();
    expect(screen.getByText('Cue Remainder')).toBeInTheDocument();
    expect(screen.getByTestId('header-lx-count')).toBeInTheDocument();
    expect(screen.getByTestId('header-vx-count')).toBeInTheDocument();

    // Workspace Strip Left Zone: View switchers
    expect(screen.getByTitle('Cue Rundown List')).toBeInTheDocument();
    expect(screen.getByTitle('Split Dual View')).toBeInTheDocument();
    expect(screen.getByTitle('Timeline Tracks')).toBeInTheDocument();
    expect(screen.getByTitle('Stage 3D Preview')).toBeInTheDocument();

    // Operator Lock toggle
    expect(screen.getByTitle('Unlocked: Hotkeys active')).toBeInTheDocument();
  });

  it('renders central hero GO button with tactile styling and explicit Space chip', () => {
    const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');

    render(
      <Header
        viewMode="split"
        setViewMode={vi.fn()}
        isOperatorLocked={false}
        setIsOperatorLocked={vi.fn()}
        onOpenProject={vi.fn()}
        onImportClick={vi.fn()}
        onExportClick={vi.fn()}
        onHelpClick={vi.fn()}
        wallClock="19:30:00"
      />
    );

    const heroGoBtn = screen.getByTestId('header-hero-go-button');
    expect(heroGoBtn).toBeInTheDocument();
    expect(heroGoBtn.className).toContain('bg-status-go');
    // 17.4: buttons use 4px corner radius (rounded), reserved 4px for controls
    expect(heroGoBtn.className).toContain('rounded');
    expect(heroGoBtn.className).toContain('font-black');

    // Explicit Space chip inside GO button
    expect(heroGoBtn).toHaveTextContent('GO');
    expect(heroGoBtn).toHaveTextContent('Space');

    // Click triggers goCue
    fireEvent.click(heroGoBtn);
    expect(goCueSpy).toHaveBeenCalled();
    goCueSpy.mockRestore();
  });

  it('renders Standby Callout, Standby Next (B), and Hold (Esc) buttons', () => {
    const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');
    const holdCueSpy = vi.spyOn(useShowStore.getState(), 'holdCue');

    render(
      <Header
        viewMode="split"
        setViewMode={vi.fn()}
        isOperatorLocked={false}
        setIsOperatorLocked={vi.fn()}
        onOpenProject={vi.fn()}
        onImportClick={vi.fn()}
        onExportClick={vi.fn()}
        onHelpClick={vi.fn()}
        wallClock="19:30:00"
      />
    );

    // Standby Callout
    expect(screen.getByText('STBY:')).toBeInTheDocument();

    // Standby Next button
    const nextBtn = screen.getByTitle('Chuyển Standby tiếp theo (Go Next Cue - B)');
    expect(nextBtn).toBeInTheDocument();
    expect(nextBtn).toHaveTextContent('B');
    fireEvent.click(nextBtn);
    expect(nextCueSpy).toHaveBeenCalled();

    // Hold button
    const holdBtn = screen.getByTitle('Stop Clock');
    expect(holdBtn).toBeInTheDocument();
    expect(holdBtn).toHaveTextContent('Esc');
    fireEvent.click(holdBtn);
    expect(holdCueSpy).toHaveBeenCalled();

    nextCueSpy.mockRestore();
    holdCueSpy.mockRestore();
  });

  it('Admin Dropdown menu toggles and exposes all secondary administration actions', () => {
    const onOpenProject = vi.fn();
    const onImportClick = vi.fn();
    const onExportClick = vi.fn();
    const onHelpClick = vi.fn();

    render(
      <Header
        viewMode="split"
        setViewMode={vi.fn()}
        isOperatorLocked={false}
        setIsOperatorLocked={vi.fn()}
        onOpenProject={onOpenProject}
        onImportClick={onImportClick}
        onExportClick={onExportClick}
        onHelpClick={onHelpClick}
        wallClock="19:30:00"
      />
    );

    const dropdownContainer = screen.getByTestId('header-admin-menu-dropdown');
    expect(dropdownContainer.className).toContain('hidden');

    // Click MoreHorizontal button to open menu
    const moreBtn = screen.getByTestId('header-admin-menu-button');
    fireEvent.click(moreBtn);
    expect(dropdownContainer.className).not.toContain('hidden');

    // Verify secondary tools exist inside the dropdown
    expect(screen.getByTitle(/Mute Audio Alerts/i)).toBeInTheDocument();
    expect(screen.getByTitle('Open Stage Confidence Clock')).toBeInTheDocument();
    expect(screen.getByTitle('New Project')).toBeInTheDocument();

    const openProjectBtn = screen.getByTitle('Open .lightstage Project');
    expect(openProjectBtn).toBeInTheDocument();
    fireEvent.click(openProjectBtn);
    expect(onOpenProject).toHaveBeenCalled();

    const importBtn = screen.getByTitle('Import CSV/TSV');
    expect(importBtn).toBeInTheDocument();
    fireEvent.click(importBtn);
    expect(onImportClick).toHaveBeenCalled();

    const exportBtn = screen.getByTitle('Export Reports & Project');
    expect(exportBtn).toBeInTheDocument();
    fireEvent.click(exportBtn);
    expect(onExportClick).toHaveBeenCalled();

    const helpBtn = screen.getByTitle('Trợ giúp & Phím tắt (Help)');
    expect(helpBtn).toBeInTheDocument();
    fireEvent.click(helpBtn);
    expect(onHelpClick).toHaveBeenCalled();
  });

  it('allows inline editing of the show title', () => {
    render(
      <Header
        viewMode="split"
        setViewMode={vi.fn()}
        isOperatorLocked={false}
        setIsOperatorLocked={vi.fn()}
        onOpenProject={vi.fn()}
        onImportClick={vi.fn()}
        onExportClick={vi.fn()}
        onHelpClick={vi.fn()}
        wallClock="19:30:00"
      />
    );

    const titleBtn = screen.getByTitle('Bấm để đổi tên show');
    fireEvent.click(titleBtn);

    const input = screen.getByDisplayValue('Concert Arena Gala');
    fireEvent.change(input, { target: { value: 'Super Bowl Halftime Show' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(useShowStore.getState().show.metadata.title).toBe('Super Bowl Halftime Show');
  });

  it('toggles audio mute', () => {
    render(
      <Header
        viewMode="split"
        setViewMode={vi.fn()}
        isOperatorLocked={false}
        setIsOperatorLocked={vi.fn()}
        onOpenProject={vi.fn()}
        onImportClick={vi.fn()}
        onExportClick={vi.fn()}
        onHelpClick={vi.fn()}
        wallClock="19:30:00"
      />
    );

    const muteBtn = screen.getByTitle(/Mute Audio Alerts/i);
    expect(muteBtn).toBeInTheDocument();
    fireEvent.click(muteBtn);

    expect(screen.getByTitle(/Unmute Audio Alerts/i)).toBeInTheDocument();
  });

  it('toggles Operator Lock when clicking lock button', () => {
    const setIsOperatorLocked = vi.fn();

    render(
      <Header
        viewMode="split"
        setViewMode={vi.fn()}
        isOperatorLocked={false}
        setIsOperatorLocked={setIsOperatorLocked}
        onOpenProject={vi.fn()}
        onImportClick={vi.fn()}
        onExportClick={vi.fn()}
        onHelpClick={vi.fn()}
        wallClock="19:30:00"
      />
    );

    const lockBtn = screen.getByTitle('Unlocked: Hotkeys active');
    fireEvent.click(lockBtn);
    expect(setIsOperatorLocked).toHaveBeenCalledWith(true);
  });

  it('renders Workspace Strip contextual controls, role filters, and Inspector toggle', () => {
    const setViewMode = vi.fn();
    const onRoleFilterChange = vi.fn();
    const onToggleInspector = vi.fn();
    const onAddCue = vi.fn();

    render(
      <Header
        viewMode="split"
        setViewMode={setViewMode}
        isOperatorLocked={false}
        setIsOperatorLocked={vi.fn()}
        onOpenProject={vi.fn()}
        onImportClick={vi.fn()}
        onExportClick={vi.fn()}
        onHelpClick={vi.fn()}
        wallClock="19:30:00"
        onRoleFilterChange={onRoleFilterChange}
        onToggleInspector={onToggleInspector}
        onAddCue={onAddCue}
      />
    );

    // View mode switcher interactions
    const stageBtn = screen.getByTitle('Stage 3D Preview');
    fireEvent.click(stageBtn);
    expect(setViewMode).toHaveBeenCalledWith('stage');

    // Contextual role filters
    expect(screen.getByText('Filter:')).toBeInTheDocument();
    const lxFilterBtn = screen.getByRole('button', { name: 'LX' });
    fireEvent.click(lxFilterBtn);
    expect(onRoleFilterChange).toHaveBeenCalledWith('LX');

    // Add cue button
    const addCueBtn = screen.getByTitle('Thêm Cue mới');
    fireEvent.click(addCueBtn);
    expect(onAddCue).toHaveBeenCalled();

    // Cue summary count
    expect(screen.getByText(/Cues/)).toBeInTheDocument();

    // Inspector Drawer toggle button with "I" chip
    const inspectorBtn = screen.getByTestId('header-inspector-toggle');
    expect(inspectorBtn).toBeInTheDocument();
    expect(inspectorBtn).toHaveTextContent('Inspector');
    expect(inspectorBtn).toHaveTextContent('I');
    fireEvent.click(inspectorBtn);
    expect(onToggleInspector).toHaveBeenCalled();
  });

  it('enforces responsive breakpoints to prevent horizontal overflow on <=1280px viewports', () => {
    render(
      <Header
        viewMode="split"
        setViewMode={vi.fn()}
        isOperatorLocked={false}
        setIsOperatorLocked={vi.fn()}
        onOpenProject={vi.fn()}
        onImportClick={vi.fn()}
        onExportClick={vi.fn()}
        onHelpClick={vi.fn()}
        wallClock="19:30:00"
      />
    );

    // 1. Standby Callout is hidden below 2xl (1536px) to prevent 1280px overflow
    const standbyCallout = screen.getByText('STBY:').closest('div');
    expect(standbyCallout?.className).toContain('hidden 2xl:flex');

    // 2. Live Hardware Badges container remains visible down to 960px (PLAN 18.6a: removed hidden xl:flex)
    const lxBadge = screen.getByTestId('header-lx-count');
    const badgesContainer = lxBadge.parentElement;
    expect(badgesContainer?.className).not.toContain('hidden xl:flex');
    expect(badgesContainer?.className).toContain('flex items-center');

    // 3. Status Dot Text ("Đã lưu") is hidden below lg (1024px)
    const statusText = screen.getByText('Đã lưu');
    expect(statusText.className).toContain('hidden lg:inline');

    // 4. Transport Button Labels ("STBY", "Hold") are hidden below lg (1024px)
    const stbyText = screen.getByText('STBY');
    expect(stbyText.className).toContain('hidden lg:inline');
    const holdText = screen.getByText('Hold');
    expect(holdText.className).toContain('hidden lg:inline');

    // 5. Operator Lock Label ("Khóa") is hidden below lg (1024px)
    const lockText = screen.getByText('Khóa');
    expect(lockText.className).toContain('hidden lg:inline');

    // 6. Delta Time block remains visible down to 960px (PLAN 18.6a: removed hidden xl:flex)
    const deltaLabel = screen.getByText('Delta');
    const deltaBlock = deltaLabel.closest('div');
    expect(deltaBlock?.className).not.toContain('hidden xl:flex');
    expect(deltaBlock?.className).toContain('flex flex-col');

    // 7. Wall Clock block is hidden below 2xl (1536px) to prevent 1280px overflow
    const wallLabel = screen.getByText('Wall');
    const wallBlock = wallLabel.closest('div');
    expect(wallBlock?.className).toContain('hidden 2xl:flex');
  });

  it('dismisses Admin Dropdown menu on Escape key and stops event propagation', () => {
    const holdCueSpy = vi.spyOn(useShowStore.getState(), 'holdCue');

    render(
      <Header
        viewMode="split"
        setViewMode={vi.fn()}
        isOperatorLocked={false}
        setIsOperatorLocked={vi.fn()}
        onOpenProject={vi.fn()}
        onImportClick={vi.fn()}
        onExportClick={vi.fn()}
        onHelpClick={vi.fn()}
        wallClock="19:30:00"
      />
    );

    const dropdownContainer = screen.getByTestId('header-admin-menu-dropdown');
    const moreBtn = screen.getByTestId('header-admin-menu-button');

    // Initially closed
    expect(dropdownContainer.className).toContain('hidden');

    // Open dropdown
    fireEvent.click(moreBtn);
    expect(dropdownContainer.className).not.toContain('hidden');

    // Press Escape inside dropdown container or trigger via fireEvent
    fireEvent.keyDown(moreBtn, { key: 'Escape', code: 'Escape' });

    // Dropdown must be closed
    expect(dropdownContainer.className).toContain('hidden');
    // Global cue hold must not have been triggered
    expect(holdCueSpy).not.toHaveBeenCalled();

    // Open dropdown again and press Escape on an item inside the menu
    fireEvent.click(moreBtn);
    expect(dropdownContainer.className).not.toContain('hidden');

    const newProjectBtn = screen.getByTitle('New Project');
    fireEvent.keyDown(newProjectBtn, { key: 'Escape', code: 'Escape' });
    expect(dropdownContainer.className).toContain('hidden');
    expect(holdCueSpy).not.toHaveBeenCalled();

    holdCueSpy.mockRestore();
  });
});
