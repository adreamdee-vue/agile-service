import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { injectIntl } from 'react-intl';
import { updateFeatureTeamAndSprint } from '@/api/FeatureApi';
import TextEditToggle from '../../../../TextEditToggle';
import SelectFocusLoad from '../../../../SelectFocusLoad';

const { Text, Edit } = TextEditToggle;

@observer
class FieldTeamAndSprint extends Component {
  handleSubmit = async (teamIds) => {
    const {
      store, onUpdate, reloadIssue,
    } = this.props;
    const issue = store.getIssue;
    const { activePiTeams, issueId } = issue;
    const originTeamIds = activePiTeams.map(team => team.id);
    const addTeams = teamIds.filter(teamId => !originTeamIds.includes(teamId));
    const removeTeams = originTeamIds.filter(teamId => !teamIds.includes(teamId));
    await updateFeatureTeamAndSprint({
      piId: issue.activePi ? issue.activePi.id : null,
      deleteSprintIds: [],
      featureId: issue.issueId,
      sprintIds: [],
      teamProjectIds: addTeams,
      deleteTeamProjectIds: removeTeams,
    });
    if (onUpdate) {
      onUpdate();
    }
    if (reloadIssue) {
      reloadIssue(issueId);
    }
  }

  render() {
    const { store, disabled } = this.props;
    const issue = store.getIssue;
    const { activePiTeams } = issue;
    const teamIds = activePiTeams.map(team => team.id);
    return (
      <div className="line-start mt-10">
        <div className="c7n-property-wrapper">
          <span className="c7n-property">
            负责的子项目
          </span>
        </div>
        <div className="c7n-value-wrapper">
          <TextEditToggle          
            formKey="team"
            disabled={disabled}
            onSubmit={this.handleSubmit}
            style={{ maxWidth: 'unset', marginRight: 10 }}
            originData={teamIds}
          >
            <Text>
              {activePiTeams.map(team => team.name).join(',')}
            </Text>
            <Edit>
              <SelectFocusLoad
                label="团队"
                style={{
                  width: '100%',
                  minWidth: 150,
                }}
                loadWhenMount
                mode="multiple"
                type="sub_project"
              />
            </Edit>
          </TextEditToggle>
        </div>
      </div>
    );
  }
}

export default withRouter(injectIntl(FieldTeamAndSprint));