import { render, screen } from '@testing-library/react';
import HomePage from '../pages/index'; // Import HomePage component

// Mock the components and constants used in the HomePage
jest.mock('../components/Layout', () => ({ children }) => <div data-testid="layout">{children}</div>);
jest.mock('../components/Home', () => ({ home }) => <div data-testid="home">Home Component</div>);
jest.mock('next/head', () => ({ children }) => <>{children}</>);
jest.mock('../constants/CONST', () => ({
    siteTitle: 'Test Site Title'
}));

describe('HomePage', () => {
    it('renders correctly with title and Home component', () => {
        // Render the HomePage
        render(<HomePage />);

        // Assert that the title is rendered
        expect(document.title).toBe('Test Site Title');

        // Check if Layout and Home components are rendered
        expect(screen.getByTestId('layout')).toBeInTheDocument();
        expect(screen.getByTestId('home')).toBeInTheDocument();
    });
});
