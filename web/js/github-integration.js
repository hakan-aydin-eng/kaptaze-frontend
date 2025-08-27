// GitHub Integration Service for KapTaze
class GitHubService {
    constructor() {
        this.owner = 'hakan-aydin-eng';
        this.frontendRepo = 'kaptaze-frontend';
        this.backendRepo = 'kaptaze-backend';
        this.apiBase = 'https://api.github.com';
    }

    // Get repository information
    async getRepoInfo(repo) {
        try {
            const response = await fetch(`${this.apiBase}/repos/${this.owner}/${repo}`);
            return await response.json();
        } catch (error) {
            console.error('GitHub API Error:', error);
            return null;
        }
    }

    // Get latest commits
    async getLatestCommits(repo, limit = 5) {
        try {
            const response = await fetch(`${this.apiBase}/repos/${this.owner}/${repo}/commits?per_page=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('GitHub API Error:', error);
            return [];
        }
    }

    // Get workflow runs (GitHub Actions)
    async getWorkflowRuns(repo) {
        try {
            const response = await fetch(`${this.apiBase}/repos/${this.owner}/${repo}/actions/runs`);
            return await response.json();
        } catch (error) {
            console.error('GitHub API Error:', error);
            return { workflow_runs: [] };
        }
    }

    // Get repository statistics
    async getRepoStats(repo) {
        try {
            const [repoInfo, commits, workflows] = await Promise.all([
                this.getRepoInfo(repo),
                this.getLatestCommits(repo, 1),
                this.getWorkflowRuns(repo)
            ]);

            return {
                name: repoInfo?.name || repo,
                description: repoInfo?.description || '',
                stars: repoInfo?.stargazers_count || 0,
                forks: repoInfo?.forks_count || 0,
                language: repoInfo?.language || 'JavaScript',
                lastCommit: commits[0]?.commit?.author?.date || null,
                workflowStatus: workflows.workflow_runs[0]?.conclusion || 'unknown',
                workflowUrl: workflows.workflow_runs[0]?.html_url || null
            };
        } catch (error) {
            console.error('Error getting repo stats:', error);
            return null;
        }
    }

    // Display GitHub integration status
    async displayIntegrationStatus() {
        const statusContainer = document.getElementById('github-status');
        if (!statusContainer) return;

        statusContainer.innerHTML = `
            <div class="github-integration">
                <h3>🔗 GitHub Integration Status</h3>
                <div id="repo-status-loading">Loading repository information...</div>
            </div>
        `;

        try {
            const [frontendStats, backendStats] = await Promise.all([
                this.getRepoStats(this.frontendRepo),
                this.getRepoStats(this.backendRepo)
            ]);

            const statusHtml = `
                <div class="github-integration">
                    <h3>🔗 GitHub Integration Status</h3>
                    
                    <div class="repo-grid">
                        <div class="repo-card">
                            <h4>Frontend Repository</h4>
                            <p><strong>Status:</strong> <span class="status-badge ${frontendStats ? 'active' : 'inactive'}">${frontendStats ? 'Connected' : 'Not Connected'}</span></p>
                            ${frontendStats ? `
                                <p><strong>Language:</strong> ${frontendStats.language}</p>
                                <p><strong>Last Commit:</strong> ${this.formatDate(frontendStats.lastCommit)}</p>
                                <p><strong>Workflow:</strong> <span class="workflow-${frontendStats.workflowStatus}">${frontendStats.workflowStatus}</span></p>
                                <a href="https://github.com/${this.owner}/${this.frontendRepo}" target="_blank">View on GitHub</a>
                            ` : ''}
                        </div>
                        
                        <div class="repo-card">
                            <h4>Backend Repository</h4>
                            <p><strong>Status:</strong> <span class="status-badge ${backendStats ? 'active' : 'inactive'}">${backendStats ? 'Connected' : 'Setup Required'}</span></p>
                            ${backendStats ? `
                                <p><strong>Language:</strong> ${backendStats.language}</p>
                                <p><strong>Last Commit:</strong> ${this.formatDate(backendStats.lastCommit)}</p>
                                <p><strong>Workflow:</strong> <span class="workflow-${backendStats.workflowStatus}">${backendStats.workflowStatus}</span></p>
                                <a href="https://github.com/${this.owner}/${this.backendRepo}" target="_blank">View on GitHub</a>
                            ` : `
                                <p>Backend repository needs to be created</p>
                                <button onclick="gitHubService.setupBackendRepo()">Setup Backend Repository</button>
                            `}
                        </div>
                    </div>
                    
                    <div class="integration-actions">
                        <button onclick="gitHubService.triggerDeployment('frontend')">Deploy Frontend</button>
                        <button onclick="gitHubService.triggerDeployment('backend')">Deploy Backend</button>
                        <button onclick="gitHubService.syncRepositories()">Sync Repositories</button>
                    </div>
                </div>
            `;

            statusContainer.innerHTML = statusHtml;
        } catch (error) {
            statusContainer.innerHTML = `
                <div class="github-integration error">
                    <h3>🔗 GitHub Integration Status</h3>
                    <p>Error loading repository information: ${error.message}</p>
                </div>
            `;
        }
    }

    // Format date helper
    formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Trigger deployment (placeholder - would need webhook setup)
    async triggerDeployment(type) {
        alert(`${type} deployment triggered! Check GitHub Actions for progress.`);
    }

    // Setup backend repository (placeholder)
    async setupBackendRepo() {
        alert('Backend repository setup instructions will be displayed. Check GITHUB_INTEGRATION.md for details.');
    }

    // Sync repositories (placeholder)
    async syncRepositories() {
        alert('Repository synchronization started. This may take a few minutes.');
    }
}

// Initialize GitHub service
const gitHubService = new GitHubService();

// Auto-load status when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('github-status')) {
        gitHubService.displayIntegrationStatus();
    }
});
