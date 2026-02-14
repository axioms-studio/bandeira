package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Project holds the schema definition for the Project entity.
type Project struct {
	ent.Schema
}

func (Project) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").Unique(),
		field.String("description").Optional(),
		field.Time("created_at").Default(time.Now).Immutable(),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (Project) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("environments", Environment.Type),
		edge.To("flags", Flag.Type),
		edge.To("api_tokens", ApiToken.Type),
	}
}
