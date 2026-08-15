import { h, render } from 'preact';
import ListElement from '../src/components/listelement';
import SearchBar from '../src/components/SearchBar';

const video = {
  videolink: 'https://www.youtube.com/watch?v=accessible-video',
  title: 'Accessible video',
  channel: 'Test channel',
  time: 120,
  duration: 600
};

describe('popup keyboard controls', () => {
  afterEach(() => {
    render(null, document.body);
  });

  test('uses a native toggle button while editing videos', () => {
    const onSelect = vi.fn();
    render(
      <ListElement
        video={video}
        index={0}
        edit
        selectedVideos={[video]}
        marginRight={0}
        maxBarWidth={226}
        eClickHandler={onSelect}
      />,
      document.body
    );

    const button = document.querySelector('button.main-list-element');
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Deselect Accessible video');
    button.click();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('uses a labeled link while viewing and closes search with Escape', () => {
    render(
      <ListElement
        video={video}
        index={0}
        edit={false}
        selectedVideos={[]}
        marginRight={0}
        maxBarWidth={226}
        eClickHandler={() => {}}
      />,
      document.body
    );
    const link = document.querySelector('a.main-list-element');
    expect(link.getAttribute('aria-label')).toBe('Open Accessible video');
    expect(link.getAttribute('rel')).toBe('noreferrer');

    const onBack = vi.fn();
    render(<SearchBar onBack={onBack} onSearchChange={() => {}} value="" />, document.body);
    const input = document.querySelector('input[aria-label="Search saved videos"]');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
